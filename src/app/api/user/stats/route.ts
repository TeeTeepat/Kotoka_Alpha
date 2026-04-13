import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const HEARTS_MAX = 5;
const RECOVERY_INTERVAL_MS = 30 * 60 * 1000; // 1 heart per 30 min

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    // FIX 10: per-user cache, 60s TTL
    const getStats = unstable_cache(
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            hearts: true,
            streak: true,
            coins: true,
            cefrLevel: true,
            createdAt: true,
            lastSessionStartedAt: true,
            lastSessionNodeId: true,
            lastSessionSkill: true,
            lastSessionProgress: true,
            lastHeartAt: true,
          },
        });

        if (!user) return null;

        // FIX 3: calculate recovered hearts since last deduction
        let hearts = user.hearts;
        let lastHeartAt = user.lastHeartAt;
        if (hearts < HEARTS_MAX && lastHeartAt) {
          const recovered = Math.floor(
            (Date.now() - lastHeartAt.getTime()) / RECOVERY_INTERVAL_MS
          );
          if (recovered > 0) {
            hearts = Math.min(HEARTS_MAX, hearts + recovered);
            const fullyRecovered = hearts >= HEARTS_MAX;
            // Update DB asynchronously (fire-and-forget)
            prisma.user.update({
              where: { id: userId },
              data: { hearts, lastHeartAt: fullyRecovered ? null : lastHeartAt },
            }).catch(() => {});
          }
        }

        const totalWordsLearned = await prisma.word.count({
          where: { masteryCount: { gte: 3 }, deck: { userId } },
        });

        return {
          hearts,
          streak: user.streak,
          coins: user.coins,
          cefrLevel: user.cefrLevel,
          lastStudiedAt: user.lastSessionStartedAt?.toISOString() ?? null,
          totalWordsLearned,
          activeSession: user.lastSessionNodeId
            ? {
                nodeId: user.lastSessionNodeId,
                skill: user.lastSessionSkill,
                progress: user.lastSessionProgress,
                startedAt: user.lastSessionStartedAt?.toISOString(),
              }
            : null,
        };
      },
      [`user-stats-${userId}`],
      { revalidate: 60, tags: [`user-stats-${userId}`] }
    );

    const data = await getStats();
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/user/stats]", err);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
