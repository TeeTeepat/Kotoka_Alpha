import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const SCENARIO_OPENERS: Record<string, { opening: string; targetWords: string[] }> = {
  "client-meeting": {
    opening: "Your client just arrived! They're ready to discuss today's meeting. What would you like to start with?",
    targetWords: ["agenda", "deadline", "proposal", "budget", "follow-up"],
  },
  "cafe-small-talk": {
    opening: "Welcome to Cozy Corner Café! What can I get for you today?",
    targetWords: ["recommend", "atmosphere", "regular", "special", "ambience"],
  },
  "airport-travel": {
    opening: "Good morning! Welcome to Suvarnabhumi Airport. Can I see your boarding pass?",
    targetWords: ["boarding", "departure", "gate", "customs", "luggage"],
  },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;
  const { scenario_type } = await req.json();

  const scenario = SCENARIO_OPENERS[scenario_type] ?? SCENARIO_OPENERS["client-meeting"];

  const convo = await prisma.conversationSession.create({
    data: {
      userId,
      scenarioType: scenario_type,
      targetWords: scenario.targetWords,
      exchanges: [{ role: "koko", message: scenario.opening }],
      wordsCompleted: [],
    },
  });

  return NextResponse.json({
    conversation_id: convo.id,
    opening_message: scenario.opening,
    target_words: scenario.targetWords,
  });
}
