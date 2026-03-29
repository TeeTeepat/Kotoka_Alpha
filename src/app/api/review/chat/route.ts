import { NextRequest, NextResponse } from "next/server";
import { geminiModel, chatPrompt } from "@/lib/gemini";

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
      learningLanguage ?? "English"
    );

    const chat = geminiModel.startChat({
      systemInstruction: { role: "user", parts: [{ text: systemInstruction }] },
      history: messages.slice(0, -1).map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text().trim();

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("[/api/review/chat]", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
