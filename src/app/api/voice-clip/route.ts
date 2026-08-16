import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const FFMPEG_PATH = "/usr/bin/ffmpeg";
const FFPROBE_PATH = "/usr/bin/ffprobe";
const CLIP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

async function cleanupExpiredClips() {
  const expired = await prisma.voiceClip.findMany({
    where: { createdAt: { lt: new Date(Date.now() - CLIP_RETENTION_MS) } },
    select: { id: true, filePath: true },
  });

  await Promise.all(
    expired.map(async (clip) => {
      await unlink(clip.filePath).catch(() => undefined);
      await prisma.voiceClip.delete({ where: { id: clip.id } }).catch(() => undefined);
    })
  );
}

function decodeBase64(audioBase64: string) {
  const normalized = audioBase64.replace(/^data:[^;]+;base64,/, "").trim();
  if (!normalized || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new Error("audioBase64 must be valid base64 audio data");
  }

  const buffer = Buffer.from(normalized, "base64");
  if (buffer.length === 0) throw new Error("Audio data is empty");
  return buffer;
}

async function probeDurationMs(filePath: string) {
  const { stdout } = await execFileAsync(FFPROBE_PATH, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const durationSeconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    throw new Error("Could not determine audio duration");
  }
  return Math.round(durationSeconds * 1000);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  void cleanupExpiredClips().catch((error) =>
    console.warn("[POST /api/voice-clip] cleanup failed", error)
  );

  let tempDir: string | undefined;
  let clipId: string | undefined;
  let finalPath: string | undefined;

  try {
    const body = (await req.json()) as {
      audioBase64?: unknown;
      word?: unknown;
      pronScore?: unknown;
    };
    if (typeof body.audioBase64 !== "string") {
      return NextResponse.json({ error: "Missing audioBase64" }, { status: 400 });
    }
    if (body.word !== undefined && typeof body.word !== "string") {
      return NextResponse.json({ error: "word must be a string" }, { status: 400 });
    }
    if (
      body.pronScore !== undefined &&
      (typeof body.pronScore !== "number" ||
        !Number.isInteger(body.pronScore) ||
        body.pronScore < 0 ||
        body.pronScore > 100)
    ) {
      return NextResponse.json({ error: "pronScore must be an integer from 0 to 100" }, { status: 400 });
    }
    const pronScore = typeof body.pronScore === "number" ? body.pronScore : undefined;
    let audioBuffer: Buffer;
    try {
      audioBuffer = decodeBase64(body.audioBase64);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid audio data" },
        { status: 400 }
      );
    }

    const tempName = randomUUID();
    tempDir = path.join(os.tmpdir(), `kotoka-voice-${tempName}`);
    const inputPath = path.join(tempDir, "input.webm");
    const outputPath = path.join(tempDir, "output.m4a");
    await mkdir(tempDir, { recursive: true });
    await writeFile(inputPath, audioBuffer);

    await execFileAsync(FFMPEG_PATH, [
      "-y",
      "-i",
      inputPath,
      "-c:a",
      "aac",
      "-b:a",
      "64k",
      outputPath,
    ]);
    const durationMs = await probeDurationMs(outputPath);

    const storageDir = path.join(process.cwd(), "storage", "voice-clips");
    await mkdir(storageDir, { recursive: true });

    const clip = await prisma.voiceClip.create({
      data: {
        userId: session.user.id,
        word: body.word?.trim() || null,
        filePath: "",
        durationMs,
        pronScore,
      },
      select: { id: true },
    });
    clipId = clip.id;
    finalPath = path.join(storageDir, `${clip.id}.m4a`);

    // copyFile + unlink (not rename): os.tmpdir() and storageDir can be on
    // different filesystems/mounts (common in containers), where rename()
    // fails with EXDEV. The tempDir cleanup in `finally` removes the source.
    await copyFile(outputPath, finalPath);
    await prisma.voiceClip.update({
      where: { id: clip.id },
      data: { filePath: finalPath },
    });

    return NextResponse.json({ id: clip.id, durationMs });
  } catch (error) {
    if (clipId) {
      await prisma.voiceClip.delete({ where: { id: clipId } }).catch(() => undefined);
    }
    if (finalPath) {
      await unlink(finalPath).catch(() => undefined);
    }
    console.error("[POST /api/voice-clip]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to store voice clip" },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
