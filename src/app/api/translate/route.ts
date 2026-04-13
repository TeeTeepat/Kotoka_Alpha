import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      // Graceful fallback when key not configured
      return NextResponse.json({ translation: text });
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target: targetLang || "th", format: "text" }),
    });

    if (!res.ok) throw new Error(`Translate API ${res.status}`);

    const data = await res.json();
    const translation = data.data?.translations?.[0]?.translatedText ?? text;

    return NextResponse.json({ translation });
  } catch (err) {
    console.error("[POST /api/translate]", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
