import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

interface SeedWordInput {
  word: string;
  thai: string;
  because: string;
  /** AR pill position on the snap photo, normalized {x,y,w,h} 0-1. */
  cropBox?: { x: number; y: number; w: number; h: number };
}

/**
 * Persist today's word set after Confirm: the confirmed object label plus
 * its k neighbour words become one deck. The seed word carries the day's
 * photo (thumbnail data URI) so Flashcard / Grove / Peak beats can show it.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as {
      label?: unknown;
      labelThai?: unknown;
      labelCropBox?: unknown;
      words?: unknown;
      photoThumb?: unknown;
      ambientSound?: unknown;
      weatherAtSnap?: unknown;
    } | null;

    const label =
      typeof body?.label === "string" && body.label.trim()
        ? body.label.trim()
        : null;
    if (!label) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    const rawWords = Array.isArray(body?.words) ? body.words : [];
    const neighbourWords: SeedWordInput[] = rawWords.filter(
      (w): w is SeedWordInput =>
        typeof w === "object" &&
        w !== null &&
        typeof (w as SeedWordInput).word === "string" &&
        typeof (w as SeedWordInput).thai === "string" &&
        typeof (w as SeedWordInput).because === "string"
    );
    // `words` may be empty — the AR snap step lets the child keep just the
    // primary object and drop every other detected pill.

    const photoThumb =
      typeof body?.photoThumb === "string" && body.photoThumb ? body.photoThumb : null;
    const photoUrl = photoThumb
      ? photoThumb.startsWith("data:")
        ? photoThumb
        : `data:image/jpeg;base64,${photoThumb}`
      : null;
    const ambientSound =
      typeof body?.ambientSound === "string" && body.ambientSound
        ? body.ambientSound
        : "cafe";
    const labelThai =
      typeof body?.labelThai === "string" && body.labelThai.trim()
        ? body.labelThai.trim()
        : label;
    const labelCropBox =
      body?.labelCropBox && typeof body.labelCropBox === "object" ? body.labelCropBox : undefined;
    const weatherAtSnap =
      typeof body?.weatherAtSnap === "string" && body.weatherAtSnap ? body.weatherAtSnap : null;

    const deck = await prisma.deck.create({
      data: {
        userId,
        sceneDesc: `Today's object: ${label}`,
        atmosphere: label,
        ambientSound,
        imageBase64: photoThumb?.startsWith("data:")
          ? photoThumb.split(",")[1] ?? null
          : photoThumb,
        weatherAtSnap,
        words: {
          create: [
            {
              word: label,
              translation: labelThai,
              example: `I found a ${label} today.`,
              difficulty: "medium",
              phonetic: "",
              becauseText: `Because you found the ${label} yourself.`,
              photoUrl,
              cropBox: labelCropBox,
            },
            ...neighbourWords.map((w) => ({
              word: w.word.trim(),
              translation: w.thai.trim(),
              example: w.because.trim(),
              difficulty: "medium",
              phonetic: "",
              becauseText: w.because.trim(),
              photoUrl,
              cropBox: w.cropBox,
            })),
          ],
        },
      },
      include: {
        words: {
          select: {
            id: true,
            word: true,
            translation: true,
            becauseText: true,
            photoUrl: true,
            cropBox: true,
          },
        },
      },
    });

    const seedWord = deck.words.find((w) => w.word === label) ?? deck.words[0];

    return NextResponse.json(
      { deckId: deck.id, seedWordId: seedWord.id, words: deck.words },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/daily/seed]", err);
    return NextResponse.json(
      { error: "Failed to save today's words" },
      { status: 500 }
    );
  }
}
