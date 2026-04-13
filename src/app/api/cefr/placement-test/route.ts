import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { cefrQuestions, calculateCEFR } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json({ questions: cefrQuestions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;
  const { answers } = await req.json();

  const result = calculateCEFR(answers as boolean[], cefrQuestions);

  await prisma.user.update({
    where: { id: userId },
    data: { cefrLevel: result.level },
  });

  return NextResponse.json({
    cefr_level: result.level,
    cefr_sublevel: `${result.level}.${result.sublevel}`,
    score: answers.filter(Boolean).length,
    total: cefrQuestions.length,
    progress: result.progress,
  });
}
