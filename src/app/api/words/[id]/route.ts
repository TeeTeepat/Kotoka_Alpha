import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { easeFactor, interval, nextReviewAt, quality } = body;

    // quality: 1=Again(reset), 2=Hard(keep), 4=Good(+1), 5=Easy(+1)
    const masteryUpdate =
      quality === 1 ? { set: 0 } : quality >= 4 ? { increment: 1 } : undefined;

    const word = await prisma.word.update({
      where: { id },
      data: {
        easeFactor,
        interval,
        nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : undefined,
        lastReviewedAt: new Date(),
        ...(masteryUpdate ? { masteryCount: masteryUpdate } : { masteryCount: { increment: 0 } }),
      },
    });

    return NextResponse.json(word);
  } catch (err) {
    console.error("[PATCH /api/words/:id]", err);
    return NextResponse.json({ error: "Failed to update word" }, { status: 500 });
  }
}
