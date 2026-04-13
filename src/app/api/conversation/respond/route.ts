import { NextRequest, NextResponse } from "next/server";
import { zhipuStream } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { userMessage, history, wordList } = await req.json();

    const wordFocus = Array.isArray(wordList) && wordList.length > 0
      ? ` Vocabulary focus words: ${wordList.join(", ")}.`
      : "";

    const system = `You are a friendly language tutor. Keep ALL your responses to 1-2 short sentences max. Use simple vocabulary. Always respond naturally and briefly.${wordFocus}`;

    const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
      { role: "system", content: system },
      ...(history ?? []).map((m: { role: string; text: string }) => ({
        role: (m.role === "model" ? "assistant" : "user") as "user" | "assistant",
        content: m.text,
      })),
      { role: "user", content: userMessage as string },
    ];

    const stream = await zhipuStream(messages);

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("[POST /api/conversation/respond]", err);
    if (err?.status === 429 || String(err?.message).includes("429")) {
      return NextResponse.json({ error: "Rate limit reached. Please wait a moment and try again." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
