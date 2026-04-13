import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const PRICES: Record<string, number> = {
  heart1: 20,
  heartAll: 95,
  streakFreeze: 50,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const { item } = await req.json();
  const price = PRICES[item];

  if (!price) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  if (user.coins < price) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (item === "heart1") {
    data.hearts = Math.min(5, user.hearts + 1);
  } else if (item === "heartAll") {
    data.hearts = 5;
  } else if (item === "streakFreeze") {
    data.streakFreezeActive = true;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      coins: { decrement: price },
    },
  });

  return NextResponse.json(updated);
}
