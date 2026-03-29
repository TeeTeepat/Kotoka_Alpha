import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;

  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const decks = await prisma.deck.findMany({
    where: { userId, NOT: { locationLat: null } },
    include: { words: { select: { id: true, word: true, translation: true, masteryCount: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(decks);
}
