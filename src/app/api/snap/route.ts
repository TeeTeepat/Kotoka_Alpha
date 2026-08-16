import { NextRequest, NextResponse } from "next/server";
import { zhipuVision, snapPrompt, type SnapObject } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export interface SnapObjectsResponse {
  scene: string;
  objects: SnapObject[];
}

const MIN_BOX = 0.02; // objects smaller than this are almost certainly noise

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Gemini's native object-detection format is [ymin,xmin,ymax,xmax] on a
 * 0-1000 scale, and it sometimes returns that instead of the requested
 * {x,y,w,h} 0-1 shape. Accept both, normalize to {x,y,w,h} 0-1, clamp into
 * bounds, and fall back to a deterministic tiled position when the box is
 * missing or degenerate so the pill still has somewhere to render.
 */
function normalizeCropBox(raw: unknown, index: number): SnapObject["cropBox"] {
  const fallback = (): SnapObject["cropBox"] => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return { x: 0.1 + col * 0.28, y: 0.15 + row * 0.32, w: 0.22, h: 0.22 };
  };

  if (Array.isArray(raw) && raw.length === 4 && raw.every((v) => typeof v === "number")) {
    const [a, b, c, d] = raw as number[];
    // Heuristic: values > 1 imply the 0-1000 [ymin,xmin,ymax,xmax] format.
    const scale = Math.max(a, b, c, d) > 1 ? 1000 : 1;
    const ymin = a / scale;
    const xmin = b / scale;
    const ymax = c / scale;
    const xmax = d / scale;
    const w = clamp01(xmax - xmin);
    const h = clamp01(ymax - ymin);
    if (w < MIN_BOX || h < MIN_BOX) return fallback();
    return { x: clamp01(xmin), y: clamp01(ymin), w, h };
  }

  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const x = typeof o.x === "number" ? o.x : null;
    const y = typeof o.y === "number" ? o.y : null;
    const w = typeof o.w === "number" ? o.w : null;
    const h = typeof o.h === "number" ? o.h : null;
    if (x !== null && y !== null && w !== null && h !== null) {
      // Same 0-1000 heuristic in case the object form used that scale too.
      const scale = Math.max(x, y, w, h) > 1 ? 1000 : 1;
      const nw = clamp01(w / scale);
      const nh = clamp01(h / scale);
      if (nw < MIN_BOX || nh < MIN_BOX) return fallback();
      return { x: clamp01(x / scale), y: clamp01(y / scale), w: nw, h: nh };
    }
  }

  return fallback();
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { image: rawImage } = await req.json();
    if (!rawImage) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    // Accept both bare base64 and full data URLs — Gemini needs bare bytes.
    const image = typeof rawImage === "string" ? rawImage.replace(/^data:[^;]+;base64,/, "") : rawImage;

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
    const parsed = JSON.parse(clean) as {
      scene?: unknown;
      objects?: unknown;
    };

    const rawObjects = Array.isArray(parsed.objects) ? parsed.objects : [];
    if (rawObjects.length === 0) {
      throw new Error("Invalid response structure from AI: no objects");
    }

    const objects: SnapObject[] = rawObjects
      .filter(
        (o): o is Record<string, unknown> =>
          typeof o === "object" && o !== null && typeof (o as any).word === "string"
      )
      .slice(0, 5)
      .map((o, i) => ({
        word: String(o.word).trim(),
        thai: typeof o.thai === "string" && o.thai.trim() ? o.thai.trim() : "",
        because:
          typeof o.because === "string" && o.because.trim()
            ? o.because.trim()
            : `I found a ${String(o.word).trim()} today.`,
        cropBox: normalizeCropBox(o.cropBox, i),
      }));

    if (objects.length === 0) {
      throw new Error("Invalid response structure from AI: no valid objects");
    }

    const scene = typeof parsed.scene === "string" && parsed.scene.trim() ? parsed.scene.trim() : "";

    const result: SnapObjectsResponse = { scene, objects };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/snap]", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
