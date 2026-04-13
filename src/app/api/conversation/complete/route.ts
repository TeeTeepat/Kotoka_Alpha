import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getRedis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;

  const { conversationId, correctChoices, totalChoices, wordsPracticed, durationSec } = await req.json();

  const accuracy = totalChoices > 0 ? correctChoices / totalChoices : 0;
  // 10 base + 5 per correct answer, capped at 35
  const coinsEarned = Math.min(10 + (correctChoices ?? 0) * 5, 35);

  await prisma.conversationSession.update({
    where: { id: conversationId, userId },
    data: {
      accuracy,
      correctChoices: correctChoices ?? 0,
      totalChoices: totalChoices ?? 0,
      wordsCompleted: Array.isArray(wordsPracticed) ? wordsPracticed : [],
      coinsAwarded: coinsEarned,
      durationSec: durationSec ?? 0,
      completedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { coins: { increment: coinsEarned } },
  });

  const redis = await getRedis();
  await redis.del(`user:${userId}`);

  return NextResponse.json({ coinsEarned, accuracy });
}
