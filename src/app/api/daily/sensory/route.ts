import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  SENSORY_SIZES,
  TEXTURES,
  type SensorySize,
  type Texture,
} from "@/lib/compositing";

/**
 * Save Sensory Tags for today's object word: one size + up to 8 texture
 * icons. Unscored — the tags only shape the collectible's look.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as {
      wordId?: unknown;
      size?: unknown;
      textures?: unknown;
    } | null;

    const wordId = typeof body?.wordId === "string" ? body.wordId : null;
    if (!wordId) {
      return NextResponse.json({ error: "wordId is required" }, { status: 400 });
    }

    const size = (SENSORY_SIZES as readonly string[]).includes(
      body?.size as string
    )
      ? (body?.size as SensorySize)
      : null;

    const textures = Array.isArray(body?.textures)
      ? (body.textures.filter((t): t is Texture =>
          (TEXTURES as readonly string[]).includes(t as string)
        ) as Texture[]).slice(0, 8)
      : [];

    const word = await prisma.word.findFirst({
      where: { id: wordId, deck: { userId } },
      select: { id: true },
    });
    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    await prisma.word.update({
      where: { id: word.id },
      data: {
        sensorySize: size,
        sensoryTextures: textures,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/daily/sensory]", err);
    return NextResponse.json(
      { error: "Failed to save sensory tags" },
      { status: 500 }
    );
  }
}
