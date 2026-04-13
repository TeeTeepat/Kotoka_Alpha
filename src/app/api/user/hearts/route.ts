import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const HEARTS_MAX = 5;
const RECOVERY_INTERVAL_MS = 20 * 60 * 1000; // 1 heart per 20 min

// POST /api/user/hearts — Atomic heart deduction (wrong answer)
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    // Atomic decrement with floor guard — race-condition safe
    try {
      const updated = await prisma.user.update({
        where: { id: userId, hearts: { gt: 0 } },
        data: { hearts: { decrement: 1 }, lastHeartAt: new Date() },
        select: { hearts: true },
      });
      return NextResponse.json({
        hearts: updated.hearts,
        nextHeartAt: updated.hearts < HEARTS_MAX ? new Date(Date.now() + RECOVERY_INTERVAL_MS).toISOString() : null,
      });
    } catch (e: unknown) {
      // P2025 = record not found (hearts already 0) — return 0 gracefully
      if ((e as { code?: string })?.code === "P2025") {
        return NextResponse.json({ hearts: 0 });
      }
      throw e;
    }
  } catch (err) {
    console.error("[POST /api/user/hearts]", err);
    return NextResponse.json({ error: "Failed to deduct heart" }, { status: 500 });
  }
}

// GET /api/user/hearts — Return current hearts with recovery applied
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true, lastHeartAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let hearts = user.hearts;
    let lastHeartAt = user.lastHeartAt;

    // Calculate recovered hearts since last deduction
    if (hearts < HEARTS_MAX && lastHeartAt) {
      const recovered = Math.floor((Date.now() - lastHeartAt.getTime()) / RECOVERY_INTERVAL_MS);
      if (recovered > 0) {
        hearts = Math.min(HEARTS_MAX, hearts + recovered);
        lastHeartAt = recovered >= HEARTS_MAX - user.hearts ? null : lastHeartAt;
        await prisma.user.update({
          where: { id: userId },
          data: { hearts, lastHeartAt },
        });
      }
    }

    // Compute when the next heart will be ready
    let nextHeartAt: string | null = null;
    if (hearts < HEARTS_MAX && lastHeartAt) {
      const elapsed = Date.now() - lastHeartAt.getTime();
      const nextMultiple = Math.floor(elapsed / RECOVERY_INTERVAL_MS) + 1;
      nextHeartAt = new Date(lastHeartAt.getTime() + nextMultiple * RECOVERY_INTERVAL_MS).toISOString();
    }

    return NextResponse.json({ hearts, nextHeartAt });
  } catch (err) {
    console.error("[GET /api/user/hearts]", err);
    return NextResponse.json({ error: "Failed to fetch hearts" }, { status: 500 });
  }
}
