import { NextRequest, NextResponse } from "next/server";
import { zhipuVision, snapPrompt } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import type { SnapResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetLanguage: true, learningLanguage: true, cefrLevel: true },
    });
    const nativeLanguage = user?.targetLanguage || "Thai";
    const learningLanguage = user?.learningLanguage || "English";
    const cefrLevel = (user?.cefrLevel ?? null) as
      | "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;

    let text: string;
    try {
      text = await zhipuVision(image, snapPrompt(nativeLanguage, learningLanguage, cefrLevel));
    } catch (e: any) {
      if (e?.status === 429) {
        return NextResponse.json(
          { error: "AI quota exceeded — please wait a moment and try again." },
          { status: 429 }
        );
      }
      throw e;
    }

    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed: SnapResponse = JSON.parse(clean);

    if (!parsed.vocabulary || !Array.isArray(parsed.vocabulary)) {
      throw new Error("Invalid response structure from AI");
    }

    if (parsed.vocabulary.length > 10) parsed.vocabulary = parsed.vocabulary.slice(0, 10);
    if (parsed.vocabulary.length < 5) {
      console.warn("[/api/snap] AI returned fewer than 5 words:", parsed.vocabulary.length);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/snap]", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
