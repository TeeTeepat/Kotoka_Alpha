import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { easeFactor, interval, nextReviewAt } = body;

    const word = await prisma.word.update({
      where: { id },
      data: {
        easeFactor,
        interval,
        nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : undefined,
        masteryCount: { increment: 1 },
      },
    });

    return NextResponse.json(word);
  } catch (err) {
    console.error("[PATCH /api/words/:id]", err);
    return NextResponse.json({ error: "Failed to update word" }, { status: 500 });
  }
}
