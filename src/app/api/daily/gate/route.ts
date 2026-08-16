import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { GATE_STEPS, isGateId } from "@/components/daily/gates";

/**
 * Journal a Path Picker gate choice.
 * Unscored activity log only — never gates progress, never returns a score.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as {
      gate?: unknown;
      wordId?: unknown;
      ageBand?: unknown;
    } | null;

    const gate = body?.gate;
    if (!isGateId(gate)) {
      return NextResponse.json(
        { error: "gate must be one of: sound, word, quiet" },
        { status: 400 }
      );
    }

    let wordId = typeof body?.wordId === "string" && body.wordId ? body.wordId : null;
    if (wordId) {
      const exists = await prisma.word.findUnique({ where: { id: wordId }, select: { id: true } });
      if (!exists) wordId = null;
    }
    const ageBand =
      body?.ageBand === "7-10" || body?.ageBand === "11-15" ? body.ageBand : null;

    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        wordId,
        kind: "gate_chosen",
        gateChosen: gate,
        payload: {
          steps: [...GATE_STEPS[gate]],
          ...(ageBand ? { ageBand } : {}),
        },
      },
    });

    return NextResponse.json({ id: entry.id, gate, steps: GATE_STEPS[gate] });
  } catch (err) {
    console.error("[POST /api/daily/gate]", err);
    return NextResponse.json({ error: "Failed to record gate" }, { status: 500 });
  }
}
