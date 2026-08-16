import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  buildReviewQueue,
  normalizeBand,
  sizingForBand,
} from "@/lib/srs/fixedSchedule";

/**
 * Today's review queue: promoted words with nextDueDate <= today, oldest
 * due first, capped at r for the user's age band. Overflow simply stays
 * due and carries to the next day.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ageBand: true, age: true },
    });
    const { r } = sizingForBand(normalizeBand(user?.ageBand, user?.age));

    const candidates = await prisma.word.findMany({
      where: {
        deck: { userId },
        promotedAt: { not: null },
        nextDueDate: { not: null },
      },
      select: {
        id: true,
        word: true,
        translation: true,
        becauseText: true,
        photoUrl: true,
        promotedAt: true,
        nextDueDate: true,
      },
    });

    const queue = buildReviewQueue(candidates, new Date(), r);
    const queued = new Set(queue.map((w) => w.id));

    return NextResponse.json({
      words: candidates
        .filter((w) => queued.has(w.id))
        .map((w) => ({
          id: w.id,
          word: w.word,
          translation: w.translation,
          becauseText: w.becauseText,
          photoUrl: w.photoUrl,
        })),
    });
  } catch (err) {
    console.error("[GET /api/daily/review-queue]", err);
    return NextResponse.json(
      { error: "Failed to build review queue" },
      { status: 500 }
    );
  }
}
