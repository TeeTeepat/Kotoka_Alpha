import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;

  const { question_id, user_answer, correct_answer } = await req.json();
  const correct = user_answer.trim().toLowerCase() === correct_answer.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const hearts = user?.hearts ?? 5;
  const newHearts = correct ? hearts : Math.max(0, hearts - 1);
  const coinsAwarded = correct ? 5 : 0;

  await prisma.user.update({
    where: { id: userId },
    data: { hearts: newHearts, coins: { increment: coinsAwarded } },
  });

  return NextResponse.json({ correct, correct_answer, coins_awarded: coinsAwarded, hearts_remaining: newHearts });
}
