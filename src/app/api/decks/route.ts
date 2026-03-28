import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("kotoka-uid")?.value ?? null;
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
    const { sceneDesc, emotionScore, atmosphere, ambientSound, note, colorPalette, vocabulary } = body;

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
        words: {
          create: vocabulary.map((v: {
            word: string; translation: string; example: string;
            difficulty: string; phonetic: string;
          }) => ({
            word: v.word,
            translation: v.translation,
            example: v.example,
            difficulty: v.difficulty,
            phonetic: v.phonetic,
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
