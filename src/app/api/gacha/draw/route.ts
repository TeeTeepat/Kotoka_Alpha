import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const RARITY_RATES = {
  common: 70,
  rare: 20,
  epic: 8,
  legendary: 2,
};

const EMOJIS: Record<string, string[]> = {
  common: ["🎯", "📚", "✏️", "🎨", "🌱"],
  rare: ["⭐", "🎪", "🎭", "🎲", "🔮"],
  epic: ["👑", "🐉", "🏆", "💎", "🦸"],
  legendary: ["🌟", "🔥", "⚡", "🌈", "🎁"],
};

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true },
  });

  if (!user || user.coins < 50) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
  }

  const roll = Math.random() * 100;
  let rarity = "common";
  let cumulative = 0;

  for (const [r, rate] of Object.entries(RARITY_RATES)) {
    cumulative += rate;
    if (roll <= cumulative) {
      rarity = r;
      break;
    }
  }

  const emojiPool = EMOJIS[rarity];
  const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
  const names = ["Buddy", "Pal", "Friend", "Chum", "Mate"];
  const name = `${emoji} ${names[Math.floor(Math.random() * names.length)]}`;

  const item = await prisma.gachaItem.create({
    data: {
      userId,
      type: "mascot",
      name,
      rarity: rarity as "common" | "rare" | "epic" | "legendary",
      emoji,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { coins: { decrement: 50 } },
  });

  return NextResponse.json(item);
}
