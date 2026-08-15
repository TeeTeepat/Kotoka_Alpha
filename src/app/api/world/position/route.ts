import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { id?: string; posX?: number; posY?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { id, posX, posY } = body;
  if (
    typeof id !== "string" ||
    typeof posX !== "number" ||
    typeof posY !== "number" ||
    !Number.isFinite(posX) ||
    !Number.isFinite(posY)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

  const result = await prisma.collectible.updateMany({
    where: { id, userId },
    data: { posX: clamp(posX), posY: clamp(posY) },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
