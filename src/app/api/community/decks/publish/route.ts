import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isValidCoords } from "@/lib/haversine";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;

  const { word_ids, lat, lng, location_name } = await req.json();
  if (!word_ids?.length || !isValidCoords(lat, lng)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const words = await prisma.word.findMany({
    where: { id: { in: word_ids } },
    include: { deck: true },
  });
  if (words.some(w => w.deck.userId !== userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const deck = await prisma.sharedDeck.create({
    data: {
      creatorId: userId,
      words: words.map(w => w.word),
      locationLat: lat,
      locationLng: lng,
      locationName: location_name ?? "Unknown location",
      expiresAt,
    },
  });

  return NextResponse.json({ deck_id: deck.id, published: true });
}
