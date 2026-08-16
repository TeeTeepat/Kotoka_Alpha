import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Parent-facing progress summary. Read-only, best-effort — every field
 * defaults to zero rather than erroring so the Parent tab never blocks
 * on a partial dataset (demo-grade).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [user, wordsTotal, wordsThisWeek, promotedTotal, promotedThisWeek, journalThisWeek, evidenceThisWeek] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true, streak: true, coins: true, completedNodes: true,
            checkpointDoneAt: true, cefrLevel: true, lastStreakDate: true,
          },
        }),
        prisma.word.count({ where: { deck: { userId } } }),
        prisma.word.count({ where: { deck: { userId, createdAt: { gte: weekAgo } } } }).catch(() => 0),
        prisma.word.count({ where: { deck: { userId }, promotedAt: { not: null } } }),
        prisma.word.count({ where: { deck: { userId }, promotedAt: { gte: weekAgo } } }),
        prisma.journalEntry.count({ where: { userId, createdAt: { gte: weekAgo } } }),
        prisma.evidenceStore.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date().toDateString();
    const dailyLoopDoneToday = !!user.checkpointDoneAt && new Date(user.checkpointDoneAt).toDateString() === today;

    return NextResponse.json({
      kidName: user.name ?? null,
      cefrLevel: user.cefrLevel ?? null,
      streak: user.streak,
      coins: user.coins,
      completedNodes: user.completedNodes,
      wordsCollectedTotal: wordsTotal,
      wordsCollectedThisWeek: wordsThisWeek,
      wordsMasteredTotal: promotedTotal,
      wordsMasteredThisWeek: promotedThisWeek,
      dailyLoopStepsThisWeek: journalThisWeek,
      dailyLoopDoneToday,
      spokenSentencesThisWeek: evidenceThisWeek,
    });
  } catch (err) {
    console.error("[GET /api/parent/summary]", err);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
