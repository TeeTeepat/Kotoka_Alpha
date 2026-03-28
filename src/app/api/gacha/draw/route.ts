import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const PRICES: Record<string, number> = {
  luggage: 100,
  vocab_pack: 80,
};

const LUGGAGE_POOL = {
  legendary: [
    { name: "Golden Passport", emoji: "\uD83D\uDEC2" },
    { name: "Diamond Briefcase", emoji: "\uD83D\uDC8E" },
    { name: "Platinum Case", emoji: "\u2728" },
  ],
  epic: [
    { name: "Safari Pack", emoji: "\uD83C\uDF92" },
    { name: "Vintage Trunk", emoji: "\uD83E\uDDF3" },
    { name: "Treasure Chest", emoji: "\uD83C\uDF81" },
  ],
  rare: [
    { name: "City Explorer", emoji: "\uD83D\uDDFA\uFE0F" },
    { name: "Laptop Bag", emoji: "\uD83D\uDCBC" },
    { name: "Camera Bag", emoji: "\uD83D\uDCF7" },
    { name: "Travel Wallet", emoji: "\uD83D\uDC5C" },
  ],
  common: [
    { name: "Canvas Tote", emoji: "\uD83D\uDC5D" },
    { name: "Gym Bag", emoji: "\uD83C\uDFCB\uFE0F" },
    { name: "Shopping Bag", emoji: "\uD83D\uDECD\uFE0F" },
    { name: "Paper Bag", emoji: "\uD83D\uDCE6" },
    { name: "Drawstring", emoji: "\uD83C\uDFBD" },
  ],
};

const VOCAB_POOL = {
  legendary: [
    { name: "Idioms Master", emoji: "\uD83C\uDFC6" },
    { name: "Business Elite", emoji: "\uD83D\uDC51" },
  ],
  epic: [
    { name: "Presentation Power", emoji: "\uD83D\uDCCA" },
    { name: "Negotiation Pro", emoji: "\uD83E\uDD1D" },
  ],
  rare: [
    { name: "Office Vocab", emoji: "\uD83C\uDFE2" },
    { name: "Email Writing", emoji: "\u2709\uFE0F" },
    { name: "Meeting Phrases", emoji: "\uD83D\uDCC5" },
  ],
  common: [
    { name: "Daily Chat", emoji: "\uD83D\uDCAC" },
    { name: "Greetings", emoji: "\uD83D\uDC4B" },
    { name: "Numbers & Time", emoji: "\uD83D\uDD22" },
    { name: "Colors", emoji: "\uD83C\uDFA8" },
  ],
};

function rollRarity(): "legendary" | "epic" | "rare" | "common" {
  const roll = Math.random();
  if (roll < 0.03) return "legendary";
  if (roll < 0.15) return "epic";
  if (roll < 0.40) return "rare";
  return "common";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const { type } = await req.json();
  const price = PRICES[type];

  if (!price) {
    return NextResponse.json({ error: "Invalid gacha type" }, { status: 400 });
  }

  if (user.coins < price) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
  }

  const pool = type === "luggage" ? LUGGAGE_POOL : VOCAB_POOL;
  const rarity = rollRarity();
  const picked = pickRandom(pool[rarity]);

  const gachaItem = await prisma.gachaItem.create({
    data: {
      userId: user.id,
      type,
      name: picked.name,
      rarity,
      emoji: picked.emoji,
    },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { coins: user.coins - price },
  });

  return NextResponse.json({ item: gachaItem, user: updatedUser });
}
