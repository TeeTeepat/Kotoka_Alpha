import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const PRICES: Record<string, number> = {
  heart1: 20,
  heartAll: 95,
  streakFreeze: 50,
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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

  const data: Record<string, unknown> = { coins: user.coins - price };

  if (item === "heart1") {
    data.hearts = Math.min(5, user.hearts + 1);
  } else if (item === "heartAll") {
    data.hearts = 5;
  } else if (item === "streakFreeze") {
    data.streakFreezeActive = true;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json(updated);
}
