import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { generateNodes, TARGET_DURATION_MIN } from "@/lib/sm2/types";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    // FIX 10: per-user cache, 120s TTL, invalidated by revalidateTag on session complete
    const getPath = unstable_cache(
      async () => {
        const dueWords = await prisma.word.findMany({
          where: {
            nextReviewAt: { lte: new Date() },
            deck: { userId },
          },
          select: { id: true },
        });

        const totalDue = dueWords.length;

        if (totalDue === 0) {
          return {
            nodes: [],
            totalDue: 0,
            nextCheckpointIndex: -1,
            estimatedTotalTimeMin: 0,
          };
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { lastSessionNodeId: true, completedNodes: true },
        });

        const completedNodeCount = user?.completedNodes ?? 0;
        const nodes = generateNodes(totalDue, completedNodeCount);

        const nextCheckpointIndex = nodes.findIndex(
          (n) => n.isCheckpoint && !n.isCompleted
        );

        return {
          nodes,
          totalDue,
          nextCheckpointIndex,
          estimatedTotalTimeMin: nodes.length * TARGET_DURATION_MIN,
        };
      },
      [`study-path-${userId}`],
      { revalidate: 120, tags: [`study-path-${userId}`] }
    );

    return NextResponse.json(await getPath());
  } catch (err) {
    console.error("[GET /api/study/path]", err);
    return NextResponse.json(
      { error: "Failed to fetch study path" },
      { status: 500 }
    );
  }
}
