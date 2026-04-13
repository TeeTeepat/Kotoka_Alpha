import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const redis = await getRedis();
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // Cache and return only safe client-facing fields (exclude password, internal flags)
  const safeUser = {
    id: user.id, name: user.name, email: user.email, image: user.image,
    hearts: user.hearts, streak: user.streak, coins: user.coins,
    streakFreezeActive: user.streakFreezeActive, targetLanguage: user.targetLanguage,
    learningLanguage: user.learningLanguage, initialLearningLanguage: user.initialLearningLanguage,
    cefrLevel: user.cefrLevel, isOnboarded: user.isOnboarded,
    age: user.age, job: user.job, salary: user.salary,
    completedNodes: user.completedNodes, timezone: user.timezone,
    lastStreakDate: user.lastStreakDate, createdAt: user.createdAt,
  };
  await redis.set(cacheKey, JSON.stringify(safeUser), 60);
  return NextResponse.json(safeUser);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  // hearts is intentionally excluded — use POST /api/user/hearts for atomic deduction
  // NOTE: initialLearningLanguage is NOT accepted from the client body — server-side only
  const { streak, coins, streakFreezeActive, targetLanguage, learningLanguage, age, job, salary, isOnboarded, cefrLevel } = body;

  const data: Record<string, unknown> = {};
  if (streak !== undefined) data.streak = streak;
  if (coins !== undefined) data.coins = coins;
  if (streakFreezeActive !== undefined) data.streakFreezeActive = streakFreezeActive;
  if (targetLanguage !== undefined) data.targetLanguage = targetLanguage;
  if (age !== undefined) data.age = age;
  if (job !== undefined) data.job = job;
  if (salary !== undefined) data.salary = salary;
  if (isOnboarded !== undefined) data.isOnboarded = isOnboarded;
  if (cefrLevel !== undefined) data.cefrLevel = cefrLevel;

  // Auto-snapshot: when an onboarded user updates learningLanguage for the first time,
  // capture the pre-update value into initialLearningLanguage (used as the streak-gate flag).
  if (learningLanguage !== undefined) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboarded: true, learningLanguage: true, initialLearningLanguage: true },
    });
    if (existing?.isOnboarded && existing.initialLearningLanguage === null) {
      data.initialLearningLanguage = existing.learningLanguage;
    }
    data.learningLanguage = learningLanguage;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  const redis = await getRedis();
  await redis.del(`user:${userId}`);

  return NextResponse.json(user);
}
