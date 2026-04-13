import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { haversineDistance, isValidCoords } from "@/lib/haversine";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");
  const radius = parseInt(searchParams.get("radius") ?? "100");

  if (!isValidCoords(lat, lng)) return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });

  const sharedDecks = await prisma.sharedDeck.findMany({
    where: { isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const nearby = sharedDecks
    .map(deck => ({
      deck_id: deck.id,
      creator_id: deck.creatorId,
      word_count: deck.words.length,
      location_name: deck.locationName,
      distance_meters: Math.round(haversineDistance(lat, lng, deck.locationLat, deck.locationLng)),
      preview_words: deck.words.slice(0, 3),
    }))
    .filter(d => d.distance_meters <= radius)
    .sort((a, b) => a.distance_meters - b.distance_meters);

  const creators = await prisma.user.findMany({
    where: { id: { in: nearby.map(d => d.creator_id) } },
    select: { id: true, name: true, cefrLevel: true },
  });
  const creatorMap = Object.fromEntries(creators.map(u => [u.id, u]));

  const result = nearby.map(d => ({
    deck_id: d.deck_id,
    creator_username: creatorMap[d.creator_id]?.name ?? "Anonymous",
    creator_cefr: creatorMap[d.creator_id]?.cefrLevel ?? "A1",
    word_count: d.word_count,
    location_name: d.location_name,
    distance_meters: d.distance_meters,
    preview_words: d.preview_words,
  }));

  return NextResponse.json({ decks: result });
}
