import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cefrLevel: true },
    });
    const level = user?.cefrLevel || "A1";

    const recentWords = await prisma.word.findMany({
      where: { deck: { userId }, masteryCount: { gte: 1 } },
      select: { word: true, translation: true, example: true },
      orderBy: { lastReviewedAt: "desc" },
      take: 10,
    });

    if (recentWords.length < 3) {
      return NextResponse.json({ questions: [], level, message: "Not enough words" });
    }

    const questions = recentWords.slice(0, 5).map((w, i) => {
      const others = recentWords.filter((_, j) => j !== i);
      const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [w.translation, ...shuffled.map(o => o.translation)].sort(() => Math.random() - 0.5);
      return { id: `cp-${i}`, word: w.word, correctAnswer: w.translation, options, example: w.example };
    });

    return NextResponse.json({ questions, level });
  } catch (err) {
    console.error("[GET /api/study/checkpoint]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { score, total } = await req.json() as { score: number; total: number };
    const accuracy = total > 0 ? score / total : 0;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cefrLevel: true },
    });

    const levels = ["A1", "A2", "B1", "B2", "C1"];
    const currentLevel = user?.cefrLevel || "A1";
    const currentIdx = levels.indexOf(currentLevel);
    let newLevel = currentLevel;
    let leveledUp = false;

    if (accuracy > 0.7 && currentIdx < levels.length - 1) {
      newLevel = levels[currentIdx + 1];
      leveledUp = true;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(leveledUp ? { cefrLevel: newLevel } : {}),
        coins: { increment: 50 }, // Atomic increment
      },
    });

    return NextResponse.json({
      accuracy: Math.round(accuracy * 100),
      leveledUp,
      previousLevel: currentLevel,
      newLevel,
      coinsAwarded: 50,
    });
  } catch (err) {
    console.error("[POST /api/study/checkpoint]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
