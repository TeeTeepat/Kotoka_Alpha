import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { nextRung, nextDueDate } from "@/lib/srs/fixedSchedule";

/**
 * Record a Study-tab atmospheric review answer. "Got it" climbs one rung on
 * the fixed ladder; "Still learning" holds the current rung. No score or
 * coins are awarded here — Study review is gamification-free by design.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { wordId, gotIt } = body as { wordId?: string; gotIt?: boolean };
    if (!wordId || typeof gotIt !== "boolean") {
      return NextResponse.json({ error: "wordId and gotIt are required" }, { status: 400 });
    }

    const word = await prisma.word.findFirst({
      where: { id: wordId, deck: { userId: session.user.id } },
      select: { id: true, srsRung: true },
    });
    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const now = new Date();
    const rung = nextRung(word.srsRung, gotIt);
    const due = nextDueDate(now, rung);

    const updated = await prisma.word.update({
      where: { id: word.id },
      data: {
        srsRung: rung,
        nextDueDate: due,
        lastReviewedAt: now,
      },
    });

    // Journal the self-report so review accuracy is computable (parent report).
    await prisma.journalEntry
      .create({
        data: { userId: session.user.id, wordId: word.id, kind: "self_report", payload: { gotIt } },
      })
      .catch(() => {});

    return NextResponse.json({ id: updated.id, srsRung: updated.srsRung, nextDueDate: updated.nextDueDate });
  } catch (err) {
    console.error("[PATCH /api/study-atmosphere/answer]", err);
    return NextResponse.json({ error: "Failed to record answer" }, { status: 500 });
  }
}
