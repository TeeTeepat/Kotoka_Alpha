import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Study tab review queue: all promoted words due today or earlier, oldest
 * due first. Unlike /api/daily/review-queue (capped at the daily r-slot),
 * this returns the full backlog for the dedicated Study review screen.
 *
 * Each word carries its own deck's atmosphere fields so the client can
 * render the "atmospheric flashcard" (scene photo + ambient sound + a
 * weather/time tint matching conditions at snap time). Deck is fetched via
 * `deck: true` (not a narrow `select`) so a newly-migrated column such as
 * `weatherAtSnap` is picked up automatically without editing this route.
 */
const QUEUE_CAP = 60;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const now = new Date();
    const words = await prisma.word.findMany({
      where: {
        deck: { userId },
        promotedAt: { not: null },
        nextDueDate: { lte: now },
      },
      include: { deck: true },
      orderBy: { nextDueDate: "asc" },
      take: QUEUE_CAP,
    });

    const totalDue = await prisma.word.count({
      where: {
        deck: { userId },
        promotedAt: { not: null },
        nextDueDate: { lte: now },
      },
    });

    return NextResponse.json({
      totalDue,
      words: words.map((w) => {
        const deckRow = w.deck as unknown as Record<string, unknown>;
        const weatherAtSnap =
          typeof deckRow.weatherAtSnap === "string" ? deckRow.weatherAtSnap : null;
        return {
          id: w.id,
          word: w.word,
          translation: w.translation,
          example: w.example,
          phonetic: w.phonetic,
          srsRung: w.srsRung,
          photoUrl: w.photoUrl,
          ambientSoundUrl: w.ambientSoundUrl,
          deck: {
            id: w.deck.id,
            atmosphere: w.deck.atmosphere,
            ambientSound: w.deck.ambientSound,
            colorPalette: w.deck.colorPalette,
            imageBase64: w.photoUrl ? null : w.deck.imageBase64, // avoid duplicate payload when the word already has its own photo
            createdAt: w.deck.createdAt,
            weatherAtSnap,
          },
        };
      }),
    });
  } catch (err) {
    console.error("[GET /api/study-atmosphere]", err);
    return NextResponse.json(
      { error: "Failed to build study review queue" },
      { status: 500 }
    );
  }
}
