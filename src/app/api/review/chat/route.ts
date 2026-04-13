import { NextRequest, NextResponse } from "next/server";
import { zhipuText, chatPrompt } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { messages, difficulty, knownWords, nativeLanguage, learningLanguage } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const systemInstruction = chatPrompt(
      difficulty ?? "easy",
      knownWords ?? [],
      nativeLanguage ?? "Thai",
      learningLanguage ?? "English",
    );

    const zhipuMessages: { role: "user" | "assistant" | "system"; content: string }[] = [
      { role: "system", content: systemInstruction },
      ...messages.map((m: { role: string; content: string }) => ({
        role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
        content: m.content,
      })),
    ];

    const text = await zhipuText(zhipuMessages);
    return NextResponse.json({ reply: text.trim() });
  } catch (err) {
    console.error("[/api/review/chat]", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
