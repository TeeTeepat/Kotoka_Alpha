import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { sortBySM2Priority, applySM2Update, estimateWordsForDuration, TARGET_DURATION_MIN } from "@/lib/sm2/types";

// Server-side coin calculation (authoritative, not client-trusted)
function calculateServerCoins(results: { correct: number; total: number }[], streak: number): number {
  const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
  const totalQuestions = results.reduce((s, r) => s + r.total, 0);
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  const base = 5;
  const perfectBonus = accuracy >= 1 ? 10 : 0;
  const streakBonus = Math.min(streak * 2, 20);
  return base + perfectBonus + streakBonus;
}

// POST /api/study/session — Start session, return due words
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json().catch(() => ({}));
    const targetWordCount = body.targetWordCount ?? estimateWordsForDuration(TARGET_DURATION_MIN);

    // FIX 2: save timezone if client sent one (fire-and-forget, non-blocking)
    if (body.timezone) {
      prisma.user.update({
        where: { id: userId },
        data: { timezone: body.timezone },
      }).catch(() => {});
    }

    // Fetch all due words for user, sorted by SM-2 priority
    const dueWords = await prisma.word.findMany({
      where: {
        nextReviewAt: { lte: new Date() },
        deck: { userId },
      },
      include: { deck: { select: { colorPalette: true, id: true } } },
    });

    if (dueWords.length === 0) {
      return NextResponse.json(
        { error: "No due words available" },
        { status: 404 }
      );
    }

    const sorted = sortBySM2Priority(dueWords);
    const sessionWords = sorted.slice(0, targetWordCount);

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Update user's session tracking
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastSessionNodeId: sessionId,
        lastSessionSkill: "flashcards",
        lastSessionProgress: 0,
        lastSessionStartedAt: new Date(),
      },
    });

    // FIX 6: lazy-load deck images via a separate query (avoids bloating word fetch)
    const uniqueDeckIds = [...new Set(sessionWords.map((w) => w.deck.id))];
    const deckImages = await prisma.deck.findMany({
      where: { id: { in: uniqueDeckIds } },
      select: { id: true, imageBase64: true },
    });
    const deckImageMap = Object.fromEntries(
      deckImages.map((d) => [d.id, d.imageBase64 ?? null])
    );

    // Build exercise prompts from word data
    const exercisePrompts = {
      conversation: `Practice these words in a conversation: ${sessionWords.map(w => w.word).join(", ")}. Start by greeting the learner and naturally using one of these words.`,
      dictationSentences: sessionWords.slice(0, 3).map(
        (w) => w.example || `The word "${w.word}" means "${w.translation}".`
      ),
      pronunciationTargets: sessionWords.map((w) => w.word),
    };

    return NextResponse.json({
      sessionId,
      words: sessionWords.map((w) => ({
        id: w.id,
        word: w.word,
        translation: w.translation,
        example: w.example,
        phonetic: w.phonetic,
        difficulty: w.difficulty,
        deckImage: deckImageMap[w.deck.id] ?? null,
      })),
      exercisePrompts,
    });
  } catch (err) {
    console.error("[POST /api/study/session]", err);
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    );
  }
}

// PUT /api/study/session — Complete session, update SM-2, award coins
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { results, skillResults } = body as {
      results: { skill: string; correct: number; total: number; vocabularyUsed: string[] }[];
      skillResults?: { wordId: string; skill: string; quality: number }[];
    };

    // Fix 4: SM-2 update using best quality per word across all skill attempts
    if (skillResults?.length) {
      // Aggregate: best quality per wordId (ownership-safe)
      const qualityByWord = new Map<string, number>();
      for (const sr of skillResults) {
        if (typeof sr.quality !== "number") continue;
        const q = Math.min(5, Math.max(0, Math.round(sr.quality)));
        const current = qualityByWord.get(sr.wordId) ?? -1;
        if (q > current) qualityByWord.set(sr.wordId, q);
      }

      if (qualityByWord.size > 0) {
        // Ownership check: fetch only user's own words
        const ownedWords = await prisma.word.findMany({
          where: {
            id: { in: Array.from(qualityByWord.keys()) },
            deck: { userId },
          },
        });

        for (const word of ownedWords) {
          const quality = qualityByWord.get(word.id) ?? 0;
          const update = applySM2Update(word, quality);
          await prisma.word.update({
            where: { id: word.id },
            data: {
              easeFactor: update.easeFactor,
              interval: update.interval,
              masteryCount: update.masteryCount,
              nextReviewAt: new Date(update.nextReviewAt),
              lastReviewedAt: new Date(),
            },
          });
        }
      }
    }

    // FIX 2: get user with timezone + lastStreakDate for DST-safe streak calc
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true, streak: true, timezone: true, lastStreakDate: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // DST-safe streak calculation: use setDate instead of ms arithmetic
    const userTz = user.timezone || "UTC";
    const today = new Date().toLocaleDateString("en-CA", { timeZone: userTz });
    let newStreak: number;
    if (user.lastStreakDate === today) {
      newStreak = user.streak; // already studied today — no double-count
    } else {
      const todayDate = new Date();
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toLocaleDateString("en-CA", { timeZone: userTz });
      newStreak = user.lastStreakDate === yesterday ? user.streak + 1 : 1;
    }

    // Server-side coin calculation (not client-trusted)
    const serverCoins = calculateServerCoins(results, user.streak);

    // Atomic update: coins, streak, lastStreakDate, completed node count
    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: serverCoins },
        streak: newStreak,
        lastStreakDate: today,
        completedNodes: { increment: 1 },
        lastSessionNodeId: null,
        lastSessionSkill: null,
        lastSessionProgress: null,
        lastSessionStartedAt: null,
      },
    });

    // FIX 10: invalidate per-user caches
    revalidateTag(`study-path-${userId}`);
    revalidateTag(`user-stats-${userId}`);

    const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.total, 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return NextResponse.json({
      success: true,
      coinsEarned: serverCoins,
      accuracy,
      sm2Updates: skillResults?.length ?? 0,
    });
  } catch (err) {
    console.error("[PUT /api/study/session]", err);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
