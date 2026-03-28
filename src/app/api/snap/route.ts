import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { geminiModel, snapPrompt } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import type { SnapResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Get user's native + learning language
    const cookieStore = await cookies();
    const userId = cookieStore.get("kotoka-uid")?.value;
    let nativeLanguage = "Thai";
    let learningLanguage = "English";
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { targetLanguage: true, learningLanguage: true },
      });
      if (user?.targetLanguage) nativeLanguage = user.targetLanguage;
      if (user?.learningLanguage) learningLanguage = user.learningLanguage;
    }

    const result = await geminiModel.generateContent([
      { text: snapPrompt(nativeLanguage, learningLanguage) },
      { inlineData: { mimeType: "image/jpeg", data: image } },
    ]);

    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed: SnapResponse = JSON.parse(clean);

    if (!parsed.vocabulary || !Array.isArray(parsed.vocabulary)) {
      throw new Error("Invalid response structure from AI");
    }

    // Clamp to 5-8 words
    parsed.vocabulary = parsed.vocabulary.slice(0, 8);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/snap]", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
