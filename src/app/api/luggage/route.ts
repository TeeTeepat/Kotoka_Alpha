import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

function getSeasonInfo(now: Date) {
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  if (m >= 12) return { season: "Autumn 🍂", nextReset: `April 1, ${y + 1}` };
  if (m >= 8)  return { season: "Summer ☀️",  nextReset: `December 1, ${y}` };
  if (m >= 4)  return { season: "Spring 🌸",  nextReset: `August 1, ${y}` };
  return        { season: "Winter ❄️",  nextReset: `April 1, ${y}` };
}

const MASTERY_THRESHOLD = 5;
const FADE_DAYS = 14;
const CAPACITY = 100;

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [masteredWords, gachaItems] = await Promise.all([
    prisma.word.findMany({
      where: {
        deck: { userId },
        OR: [{ masteryCount: { gte: MASTERY_THRESHOLD } }, { interval: { gte: 21 } }],
      },
      orderBy: { masteryCount: "desc" },
      select: { id: true, word: true, masteryCount: true, interval: true, lastReviewedAt: true },
    }),
    prisma.gachaItem.findMany({
      where: { userId },
      orderBy: { pulledAt: "asc" },
    }),
  ]);

  const now = Date.now();
  const fadeCutoff = FADE_DAYS * 24 * 60 * 60 * 1000;

  const items = gachaItems.map((item, i) => {
    const mw = i < masteredWords.length ? masteredWords[i] : null;
    const isFading = mw?.lastReviewedAt
      ? now - new Date(mw.lastReviewedAt).getTime() > fadeCutoff
      : false;
    return { ...item, isUnlocked: i < masteredWords.length, masteredWord: mw, isFading };
  });

  return NextResponse.json({
    items,
    capacity: { used: masteredWords.length, total: CAPACITY },
    season: getSeasonInfo(new Date()),
  });
}
