import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;

  const { accuracy, is_daily_first } = await req.json();

  let coins = 50; // base
  if (accuracy >= 0.8) coins = 70;
  if (is_daily_first) coins += 10;

  const reason = accuracy >= 0.8 ? "accuracy" : is_daily_first ? "daily_first" : "base";

  await prisma.user.update({
    where: { id: userId },
    data: { coins: { increment: coins } },
  });

  const weekNumber = Math.ceil(((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const cefrLevel = user?.cefrLevel ?? "A1";

  await prisma.leaderboardEntry.upsert({
    where: { userId_weekNumber_cefrLevel: { userId, weekNumber, cefrLevel } },
    create: { userId, cefrLevel, weekNumber, wordsMastered: 1 },
    update: { wordsMastered: { increment: 1 } },
  });

  return NextResponse.json({ coins, reason });
}
