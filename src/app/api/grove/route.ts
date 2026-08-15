import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

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
          },
        },
      },
    }),
    prisma.topicShimmer.findMany({
      where: { userId },
      select: { topic: true, cefrBand: true, earnedAt: true },
    }),
  ]);

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
  }));

  const shimmers = shimmerRows.map((s) => ({
    topic: s.topic,
    cefrBand: s.cefrBand,
    earnedAt: s.earnedAt.toISOString(),
  }));

  return NextResponse.json({ words, shimmers });
}
