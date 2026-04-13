import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

function getWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const cefrLevel = searchParams.get("cefr_level") ?? "all";
  const weekNumber = getWeekNumber();

  const entries = await prisma.leaderboardEntry.findMany({
    where: { weekNumber, ...(cefrLevel !== "all" ? { cefrLevel } : {}) },
    orderBy: [{ wordsMastered: "desc" }],
    take: 20,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: entries.map(e => e.userId) } },
    select: { id: true, name: true, streak: true, cefrLevel: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const rankings = entries.map((e, i) => ({
    rank: i + 1,
    username: userMap[e.userId]?.name ?? "Anonymous",
    words_mastered: e.wordsMastered,
    streak: userMap[e.userId]?.streak ?? 0,
    cefr_level: e.cefrLevel,
    is_current_user: e.userId === userId,
  }));

  const currentUserRank = rankings.find(r => r.is_current_user)?.rank ?? null;
  const weekEndsAt = new Date();
  weekEndsAt.setDate(weekEndsAt.getDate() + (7 - weekEndsAt.getDay()));
  weekEndsAt.setHours(23, 59, 59, 0);

  return NextResponse.json({ rankings, current_user_rank: currentUserRank, week_ends_at: weekEndsAt.toISOString(), week_number: weekNumber });
}
