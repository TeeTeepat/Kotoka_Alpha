import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { nextRung, nextDueDate } from "@/lib/srs/fixedSchedule";

/**
 * Flashcard self-report: "Got it" / "Still learning".
 * Fixed-ladder SRS writes — "Got it" advances one rung (and promotes the
 * word on its first "Got it"); "Still learning" HOLDS the current rung
 * (the ladder never moves backward). No score is ever returned.
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
      gotIt?: unknown;
    } | null;

    const wordId = typeof body?.wordId === "string" ? body.wordId : null;
    const gotIt = body?.gotIt === true;
    if (!wordId) {
      return NextResponse.json({ error: "wordId is required" }, { status: 400 });
    }

    // Ownership check: the word must belong to one of the user's decks.
    const word = await prisma.word.findFirst({
      where: { id: wordId, deck: { userId } },
      select: { id: true, srsRung: true, promotedAt: true },
    });
    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const now = new Date();
    const rung = nextRung(word.srsRung, gotIt);

    await prisma.word.update({
      where: { id: word.id },
      data: {
        srsRung: rung,
        // First "Got it" promotes the word into the review ladder.
        promotedAt: word.promotedAt ?? (gotIt ? now : undefined),
        // Advance schedules the new rung; hold re-schedules the same rung.
        // Never scheduled at all until the word has been promoted.
        nextDueDate:
          word.promotedAt || gotIt ? nextDueDate(now, rung) : undefined,
        lastReviewedAt: now,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/daily/selfreport]", err);
    return NextResponse.json(
      { error: "Failed to record self-report" },
      { status: 500 }
    );
  }
}
