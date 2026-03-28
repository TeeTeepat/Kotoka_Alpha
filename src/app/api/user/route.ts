import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { hearts, streak, coins, streakFreezeActive, targetLanguage, learningLanguage } = body;

  const data: Record<string, unknown> = {};
  if (hearts !== undefined) data.hearts = hearts;
  if (streak !== undefined) data.streak = streak;
  if (coins !== undefined) data.coins = coins;
  if (streakFreezeActive !== undefined) data.streakFreezeActive = streakFreezeActive;
  if (targetLanguage !== undefined) data.targetLanguage = targetLanguage;
  if (learningLanguage !== undefined) data.learningLanguage = learningLanguage;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json(user);
}
