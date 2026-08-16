import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import type { CropBox } from "@/components/grove/types";

/** Loosely validate a JSON value as a normalized 0-1 crop box. */
function toCropBox(value: unknown): CropBox | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const { x, y, w, h } = v;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof w !== "number" ||
    typeof h !== "number" ||
    !(w > 0 && h > 0)
  ) {
    return null;
  }
  return { x, y, w, h };
}

/**
 * Grove data: every promoted word (promotedAt != null) for the signed-in
 * user, plus earned topic shimmers. The Grove gates nothing and shows no
 * percentages — this endpoint returns raw material for replay only.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const [rows, shimmerRows] = await Promise.all([
    prisma.word.findMany({
      where: {
        promotedAt: { not: null },
        deck: { userId },
      },
      orderBy: { promotedAt: "desc" },
      select: {
        id: true,
        word: true,
        translation: true,
        becauseText: true,
        photoUrl: true,
        ambientSoundUrl: true,
        bodyPlan: true,
        sensorySize: true,
        sensoryTextures: true,
        promotedAt: true,
        deck: {
          select: {
            atmosphere: true,
            ambientSound: true,
            locationName: true,
            sceneDesc: true,
          },
        },
      },
    }),
    prisma.topicShimmer.findMany({
      where: { userId },
      select: { topic: true, cefrBand: true, earnedAt: true },
    }),
  ]);

  // cropBox is a WS2-added column that may not exist in the DB yet. A raw
  // query keeps this endpoint compiling and working before that migration
  // lands — an error here (unknown column) just means no crop data yet.
  const cropBoxById = new Map<string, CropBox | null>();
  if (rows.length > 0) {
    try {
      const raw = await prisma.$queryRawUnsafe<{ id: string; cropBox: unknown }[]>(
        `SELECT id, "cropBox" FROM "Word" WHERE id = ANY($1::text[])`,
        rows.map((w) => w.id)
      );
      for (const r of raw) cropBoxById.set(r.id, toCropBox(r.cropBox));
    } catch {
      // column doesn't exist yet — every card falls back to the full photo
    }
  }

  const words = rows.map((w) => ({
    id: w.id,
    word: w.word,
    translation: w.translation,
    becauseText: w.becauseText,
    photoUrl: w.photoUrl,
    ambientSoundUrl: w.ambientSoundUrl,
    bodyPlan: w.bodyPlan,
    sensorySize: w.sensorySize,
    sensoryTextures: w.sensoryTextures,
    promotedAt: w.promotedAt?.toISOString() ?? null,
    topic: w.deck?.atmosphere ?? null,
    deckAmbientSound: w.deck?.ambientSound ?? null,
    locationName: w.deck?.locationName ?? null,
    sceneDesc: w.deck?.sceneDesc ?? null,
    cropBox: cropBoxById.get(w.id) ?? null,
  }));

  const shimmers = shimmerRows.map((s) => ({
    topic: s.topic,
    cefrBand: s.cefrBand,
    earnedAt: s.earnedAt.toISOString(),
  }));

  return NextResponse.json({ words, shimmers });
}
