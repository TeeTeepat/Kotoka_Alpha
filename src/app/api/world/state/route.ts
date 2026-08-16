import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { mapOpenWeather } from "@/lib/compositing";

// Default coordinates (Bangkok) when the client sends none.
const DEFAULT_LAT = 13.7563;
const DEFAULT_LON = 100.5018;

let weatherCache: { weather: string; fetchedAt: number } | null = null;
const WEATHER_TTL_MS = 15 * 60 * 1000;

async function getWeather(lat: number, lon: number): Promise<string> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return "clear";
  if (weatherCache && Date.now() - weatherCache.fetchedAt < WEATHER_TTL_MS) {
    return weatherCache.weather;
  }
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return "clear";
    const data = await res.json();
    const weather = mapOpenWeather(data?.weather?.[0]?.main);
    weatherCache = { weather, fetchedAt: Date.now() };
    return weather;
  } catch {
    return "clear";
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "") || DEFAULT_LAT;
  const lon = parseFloat(url.searchParams.get("lon") ?? "") || DEFAULT_LON;

  const [weather, user, rows] = await Promise.all([
    getWeather(lat, lon),
    prisma.user.findUnique({
      where: { id: userId },
      select: { peakBPendingAt: true, dayObjectWordId: true },
    }),
    prisma.collectible.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        word: {
          select: {
            word: true,
            translation: true,
            bodyPlan: true,
            sensorySize: true,
            sensoryTextures: true,
            photoUrl: true,
            deck: { select: { atmosphere: true } },
          },
        },
      },
    }),
  ]);

  const collectibles = rows.map((c) => ({
    id: c.id,
    wordId: c.wordId,
    posX: c.posX,
    posY: c.posY,
    dim: c.dim,
    settledPhotoUrl: c.settledPhotoUrl,
    settledAt: c.settledAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    word: c.word.word,
    translation: c.word.translation,
    bodyPlan: c.word.bodyPlan,
    sensorySize: c.word.sensorySize,
    sensoryTextures: c.word.sensoryTextures,
    photoUrl: c.word.photoUrl,
    topic: c.word.deck?.atmosphere ?? null,
  }));

  // Pending Peak B (overnight reveal): app closed before the settle beat
  // could play. Ship today's object so the client can play it on mount.
  let peakB: {
    pendingAt: string;
    word: string | null;
    photoUrl: string | null;
  } | null = null;
  if (user?.peakBPendingAt) {
    const dayWord = user.dayObjectWordId
      ? await prisma.word.findUnique({
          where: { id: user.dayObjectWordId },
          select: { word: true, photoUrl: true },
        })
      : null;
    peakB = {
      pendingAt: user.peakBPendingAt.toISOString(),
      word: dayWord?.word ?? null,
      photoUrl: dayWord?.photoUrl ?? null,
    };
  }

  return NextResponse.json({ weather, collectibles, peakB });
}
