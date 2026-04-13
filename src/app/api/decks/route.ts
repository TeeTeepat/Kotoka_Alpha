import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    const decks = await prisma.deck.findMany({
      where: userId ? { userId } : { userId: null },
      include: { words: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(decks);
  } catch (err) {
    console.error("[GET /api/decks]", err);
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const {
      sceneDesc, emotionScore, atmosphere, ambientSound, note,
      colorPalette, vocabulary, locationLat, locationLng, locationName,
      imageBase64,
    } = body;

    if (!sceneDesc || !vocabulary?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const deck = await prisma.deck.create({
      data: {
        userId: userId ?? undefined,
        sceneDesc,
        emotionScore: emotionScore ?? 50,
        atmosphere: atmosphere ?? "ambient",
        ambientSound: ambientSound ?? "cafe",
        note: note || null,
        colorPalette: colorPalette ?? "#1ad3e2",
        locationLat: locationLat ?? null,
        locationLng: locationLng ?? null,
        locationName: locationName ?? null,
        imageBase64: imageBase64 ?? null,
        words: {
          // FIX 7: stagger nextReviewAt by 2 min per word so SM-2 doesn't batch them
          create: vocabulary.map((v: {
            word: string; translation: string; example: string;
            difficulty: string; phonetic: string;
          }, i: number) => ({
            word: v.word,
            translation: v.translation,
            example: v.example,
            difficulty: v.difficulty,
            phonetic: v.phonetic,
            nextReviewAt: new Date(Date.now() + i * 2 * 60 * 1000),
          })),
        },
      },
      include: { words: true },
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (err) {
    console.error("[POST /api/decks]", err);
    return NextResponse.json({ error: "Failed to save deck" }, { status: 500 });
  }
}
