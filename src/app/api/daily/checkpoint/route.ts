import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Marks the checkpoint (Second Take) as complete for today.
 * Sets peakBPendingAt + dayObjectWordId immediately so that if the app is
 * closed before the "done for today" tap, Peak B plays as an overnight
 * reveal on next launch (/api/world/state ships it; /api/daily/done and
 * /api/daily/peakb-seen clear it).
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
      sentenceText?: unknown;
    } | null;

    let wordId = typeof body?.wordId === "string" && body.wordId ? body.wordId : null;
    if (wordId) {
      const owned = await prisma.word.findFirst({
        where: { id: wordId, deck: { userId } },
        select: { id: true },
      });
      if (!owned) wordId = null;
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        checkpointDoneAt: now,
        peakBPendingAt: now,
        dayObjectWordId: wordId,
      },
    });

    // Evidence of effort (never graded): the sentence the child spoke.
    const sentenceText =
      typeof body?.sentenceText === "string" && body.sentenceText.trim()
        ? body.sentenceText.trim()
        : null;
    if (wordId && sentenceText) {
      await prisma.evidenceStore.create({
        data: { userId, wordId, sentenceText },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/daily/checkpoint]", err);
    return NextResponse.json(
      { error: "Failed to record checkpoint" },
      { status: 500 }
    );
  }
}
