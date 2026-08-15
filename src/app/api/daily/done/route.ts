import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/** Deterministic small hash so a word always lands in the same spot. */
function hashInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * "Done for today" — the day's object settles into the world (Peak B).
 * Creates the Collectible row (dim until later celebrated by promotion),
 * clears the pending overnight reveal, and snapshots a TopicShimmer once
 * every word of the (topic, cefrBand) pair has been promoted. Shimmers are
 * never revoked.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as {
      wordId?: unknown;
    } | null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dayObjectWordId: true, cefrLevel: true },
    });

    const requestedId =
      typeof body?.wordId === "string" && body.wordId ? body.wordId : null;
    const wordId = requestedId ?? user?.dayObjectWordId ?? null;
    if (!wordId) {
      return NextResponse.json(
        { error: "No day object to settle" },
        { status: 400 }
      );
    }

    const word = await prisma.word.findFirst({
      where: { id: wordId, deck: { userId } },
      select: {
        id: true,
        photoUrl: true,
        promotedAt: true,
        deck: { select: { atmosphere: true } },
      },
    });
    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const now = new Date();
    const h = hashInt(word.id);

    // The object takes its place in the world with today's photo baked in.
    await prisma.collectible.upsert({
      where: { userId_wordId: { userId, wordId: word.id } },
      create: {
        userId,
        wordId: word.id,
        posX: 6 + (h % 88),
        posY: 55 + ((h >> 8) % 36),
        dim: word.promotedAt === null,
        settledPhotoUrl: word.photoUrl,
        settledAt: now,
      },
      update: {
        settledPhotoUrl: word.photoUrl,
        settledAt: now,
        dim: word.promotedAt === null,
      },
    });

    // Peak B has now played — nothing pending for the overnight reveal.
    await prisma.user.update({
      where: { id: userId },
      data: { peakBPendingAt: null },
    });

    // Shimmer snapshot: per (topic, cefrBand), once ALL of its words are
    // promoted. Snapshot once, never revoked (create only if missing).
    const topic = word.deck?.atmosphere ?? null;
    const cefrBand = user?.cefrLevel ?? "A1";
    if (topic) {
      const topicWords = await prisma.word.findMany({
        where: { deck: { userId, atmosphere: topic } },
        select: { promotedAt: true },
      });
      const allPromoted =
        topicWords.length > 0 && topicWords.every((w) => w.promotedAt !== null);
      if (allPromoted) {
        const existing = await prisma.topicShimmer.findUnique({
          where: { userId_topic_cefrBand: { userId, topic, cefrBand } },
          select: { id: true },
        });
        if (!existing) {
          await prisma.topicShimmer.create({
            data: { userId, topic, cefrBand },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/daily/done]", err);
    return NextResponse.json(
      { error: "Failed to settle today's object" },
      { status: 500 }
    );
  }
}
