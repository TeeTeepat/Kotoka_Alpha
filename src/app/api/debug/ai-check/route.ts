import { NextResponse } from "next/server";
import { zhipuText } from "@/lib/gemini";

export async function GET() {
  const start = Date.now();
  try {
    const reply = await zhipuText([{ role: "user", content: "Say OK" }]);
    return NextResponse.json({
      ok: true,
      reply: reply.trim(),
      latencyMs: Date.now() - start,
      key: `${process.env.GEMINI_API_KEY?.slice(0, 8)}…`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number }).status;
    return NextResponse.json(
      {
        ok: false,
        error: message,
        status,
        latencyMs: Date.now() - start,
        key: `${process.env.GEMINI_API_KEY?.slice(0, 8)}…`,
      },
      { status: 200 }, // always 200 so the browser shows the JSON
    );
  }
}
