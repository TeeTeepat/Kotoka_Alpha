import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

function generateQuestion(word: string, wordId: string, cefrLevel: string) {
  const templates = [
    { sentence: `The manager asked the team to [${word}] the new process.`, distractors: ["reject", "ignore", "cancel"] },
    { sentence: `It was important to [${word}] before making a final decision.`, distractors: ["rush", "skip", "avoid"] },
    { sentence: `She learned how to [${word}] effectively during the training session.`, distractors: ["forget", "delay", "dismiss"] },
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  const isBeginnerMode = ["A1", "A2"].includes(cefrLevel);

  return {
    id: `q-${wordId}-${Date.now()}`,
    sentence_with_blank: template.sentence.replace(`[${word}]`, "_____"),
    correct_answer: word,
    options: isBeginnerMode
      ? shuffleArray([word, ...template.distractors])
      : undefined,
    hint: `Starts with "${word[0]}"`,
    word_id: wordId,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const count = Math.min(parseInt(searchParams.get("count") ?? "10"), 20);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const cefrLevel = user?.cefrLevel ?? "A1";

  const words = await prisma.word.findMany({
    where: { deck: { userId } },
    orderBy: { nextReviewAt: "asc" },
    take: count,
  });

  if (words.length === 0) {
    return NextResponse.json({ questions: [] });
  }

  const questions = words.map(w => generateQuestion(w.word, w.id, cefrLevel));
  return NextResponse.json({ questions });
}
