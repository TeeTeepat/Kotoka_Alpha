import { NextRequest, NextResponse } from "next/server";
import { zhipuText } from "@/lib/gemini";
import { auth } from "@/auth";

const FALLBACK = { choices: ["Yes, I understand.", "Sorry, can you repeat?", "I don't know."], correctIndex: 0 };

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const aiReply = String(body.aiReply ?? "").replace(/["\\\n\r]/g, " ").slice(0, 500);
    const wordList = Array.isArray(body.wordList)
      ? (body.wordList as unknown[]).filter((w): w is string => typeof w === "string").slice(0, 20)
      : [];

    const prompt = `Given this AI tutor message: ${aiReply}
And these vocabulary words to practice: ${wordList.join(", ")}

Generate exactly 3 short response options (1 sentence each):
- One correct/natural response that uses at least one vocabulary word
- Two plausible but clearly wrong or awkward distractors

Shuffle the 3 options randomly. Return ONLY valid JSON:
{"choices": ["option1", "option2", "option3"], "correctIndex": 0}
where correctIndex is the 0-based index of the correct option in the shuffled array.`;

    const text = await zhipuText([{ role: "user", content: prompt }]);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.choices) || parsed.choices.length !== 3) {
      throw new Error("Invalid choices array");
    }

    return NextResponse.json({ choices: parsed.choices });
  } catch (err) {
    console.error("[POST /api/conversation/choices]", err);
    return NextResponse.json(FALLBACK);
  }
}
