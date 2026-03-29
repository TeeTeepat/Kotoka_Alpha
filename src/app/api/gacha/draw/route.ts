import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { geminiModel } from "@/lib/gemini";

const PRICES: Record<string, number> = { luggage: 100, vocab_pack: 80 };

const LUGGAGE_POOL = {
  legendary: [
    { name: "Golden Passport", emoji: "🛂" },
    { name: "Diamond Briefcase", emoji: "💎" },
    { name: "Platinum Case", emoji: "✨" },
  ],
  epic: [
    { name: "Safari Pack", emoji: "🎒" },
    { name: "Vintage Trunk", emoji: "🧳" },
    { name: "Treasure Chest", emoji: "🎁" },
  ],
  rare: [
    { name: "City Explorer", emoji: "🗺️" },
    { name: "Laptop Bag", emoji: "💼" },
    { name: "Camera Bag", emoji: "📷" },
    { name: "Travel Wallet", emoji: "👜" },
  ],
  common: [
    { name: "Canvas Tote", emoji: "👝" },
    { name: "Gym Bag", emoji: "🏋️" },
    { name: "Shopping Bag", emoji: "🛍️" },
    { name: "Paper Bag", emoji: "📦" },
    { name: "Drawstring Bag", emoji: "🎽" },
  ],
};

const SITUATIONS = [
  "airport check-in", "restaurant ordering", "hotel reception",
  "shopping mall", "pharmacy visit", "taxi ride", "coffee shop",
  "job interview", "doctor visit", "supermarket", "gym workout",
  "museum visit", "beach day", "birthday party", "train station",
];

const DECK_COLORS = ["#8B5CF6", "#1ad3e2", "#f5c842", "#ff8c42", "#ec4899", "#10b981"];

function rollRarity(): "legendary" | "epic" | "rare" | "common" {
  const r = Math.random();
  if (r < 0.03) return "legendary";
  if (r < 0.15) return "epic";
  if (r < 0.40) return "rare";
  return "common";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const { type } = await req.json();
  const price = PRICES[type];
  if (!price) return NextResponse.json({ error: "Invalid gacha type" }, { status: 400 });
  if (user.coins < price) return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { coins: user.coins - price },
  });

  // --- Luggage Draw ---
  if (type === "luggage") {
    const rarity = rollRarity();
    const picked = pickRandom(LUGGAGE_POOL[rarity]);
    const gachaItem = await prisma.gachaItem.create({
      data: { userId, type, name: picked.name, rarity, emoji: picked.emoji },
    });
    return NextResponse.json({ item: gachaItem, user: updatedUser });
  }

  // --- Vocab Pack Draw (Gemini AI) ---
  const situation = pickRandom(SITUATIONS);
  const nativeLang = user.targetLanguage || "Thai";
  const learningLang = user.learningLanguage || "English";
  const color = pickRandom(DECK_COLORS);

  type VocabEntry = { word: string; translation: string; example: string; difficulty: string; phonetic: string };
  let vocabulary: VocabEntry[] = [];
  let sceneName = situation;

  try {
    const prompt = `Generate 8 ${learningLang} vocabulary words for the situation: "${situation}".
The learner's native language is ${nativeLang}. Return ONLY valid JSON, no markdown:
{"scene":"${nativeLang} label for this situation (max 4 words)","vocabulary":[{"word":"${learningLang} word","translation":"${nativeLang} meaning","example":"natural ${learningLang} sentence","difficulty":"beginner|intermediate|advanced","phonetic":"IPA"}]}`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(text);
    sceneName = parsed.scene || situation;
    vocabulary = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [];
  } catch {
    // fallback: create deck with no words if Gemini fails
  }

  const deck = await prisma.deck.create({
    data: {
      userId,
      sceneDesc: sceneName,
      emotionScore: 70,
      atmosphere: "ambient",
      ambientSound: "city",
      colorPalette: color,
      words: {
        create: vocabulary.map((v) => ({
          word: v.word || "",
          translation: v.translation || "",
          example: v.example || "",
          difficulty: v.difficulty || "intermediate",
          phonetic: v.phonetic || "",
        })),
      },
    },
    include: { words: true },
  });

  const rarity = rollRarity();
  const gachaItem = await prisma.gachaItem.create({
    data: { userId, type, name: `${sceneName} Pack`, rarity, emoji: "📚" },
  });

  return NextResponse.json({ item: gachaItem, user: updatedUser, deck });
}
