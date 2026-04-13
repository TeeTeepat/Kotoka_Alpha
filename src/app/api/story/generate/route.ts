import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

function getWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
}

const STORY_TEMPLATES = [
  (words: string[], name: string) => `It was a Tuesday when ${name || "Mana"} had to use the word [${words[0] ?? "learn"}] for the very first time at work. The situation called for quick thinking. She took a deep breath and said it clearly — [${words[1] ?? "practice"}]. Her colleague nodded, impressed. By afternoon, she had naturally used [${words[2] ?? "improve"}] in three different conversations. That evening, walking home, she smiled to herself. [${words[3] ?? "grow"}] and [${words[4] ?? "succeed"}] — that's all it takes, one word at a time.`,
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;
  const weekNumber = getWeekNumber();

  const recentDecks = await prisma.deck.findMany({
    where: { userId },
    include: { words: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const words = recentDecks.flatMap(d => d.words.map(w => w.word)).slice(0, 8);
  if (words.length < 3) {
    return NextResponse.json({ error: "Not enough words. Snap at least 3 words first!" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const storyText = STORY_TEMPLATES[0](words, user?.name ?? "Mana");
  const reflectionQ = `Which word felt most natural this week?`;

  const story = await prisma.weeklyStory.upsert({
    where: { userId_weekNumber: { userId, weekNumber } },
    create: { userId, weekNumber, storyText, wordsUsed: words, reflectionQ },
    update: { storyText, wordsUsed: words, reflectionQ },
  });

  return NextResponse.json(story);
}
