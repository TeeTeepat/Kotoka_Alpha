import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clip = await prisma.voiceClip.findUnique({
    where: { id },
    select: { filePath: true },
  });
  if (!clip?.filePath) return new NextResponse(null, { status: 404 });

  try {
    await access(clip.filePath);
    const stream = Readable.toWeb(createReadStream(clip.filePath)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "audio/mp4",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
