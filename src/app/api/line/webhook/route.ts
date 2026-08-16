import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { replyMessage } from "@/lib/line";

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string; type?: string };
  message?: { type: string; text?: string };
};

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handlePairingText(event: LineEvent) {
  const text = event.message?.text?.trim();
  const userId = event.source?.userId;
  if (!text || !userId) return;

  const code = text.replace(/\D/g, "");
  if (code.length !== 6) {
    if (event.replyToken) {
      await replyMessage(
        event.replyToken,
        "Hi! To connect, open the Parent tab in Kotoka, tap \"Get pairing code\", and send me that 6-digit code."
      );
    }
    return;
  }

  const match = await prisma.user.findFirst({
    where: { linePairCode: code, linePairCodeExpiresAt: { gt: new Date() } },
    select: { id: true },
  });

  if (!match) {
    if (event.replyToken) {
      await replyMessage(event.replyToken, "That code doesn't match — it may have expired. Get a fresh one from the Parent tab.");
    }
    return;
  }

  await prisma.user.update({
    where: { id: match.id },
    data: { lineParentUserId: userId, linePairCode: null, linePairCodeExpiresAt: null },
  });

  if (event.replyToken) {
    await replyMessage(event.replyToken, "Connected! You'll now receive learning reports 🌱");
  }
}

/**
 * LINE Messaging API webhook. Demo-grade: verifies the signature when
 * LINE_CHANNEL_SECRET is set (rejects with 401 on mismatch).
 * - `follow` event (parent adds the bot as a friend): logged for the
 *   LINE_DEMO_PARENT_USER_ID fallback path — read-only, safe either way.
 * - `message` (text) event: treated as a pairing-code attempt — matches
 *   against any user's unexpired linePairCode and WRITES lineParentUserId
 *   on match, so this path only runs once the signature is verified. If
 *   LINE_CHANNEL_SECRET is unset, message events are logged and ignored
 *   rather than trusted with a DB write.
 * Always returns 200 so LINE doesn't retry-storm us, except on a bad signature.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.LINE_CHANNEL_SECRET;
  const signature = req.headers.get("x-line-signature");

  if (secret && !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  // Pairing writes to the DB, so an unverified request must never reach it.
  const verified = Boolean(secret);

  try {
    const body = JSON.parse(rawBody) as { events?: LineEvent[] };
    for (const event of body.events ?? []) {
      if (event.type === "follow" && event.source?.userId) {
        console.log(`[line webhook] follow event — userId: ${event.source.userId}`);
      } else if (event.type === "message" && event.message?.type === "text") {
        if (!verified) {
          console.log("[line webhook] message event ignored — LINE_CHANNEL_SECRET not set, refusing to write DB");
          continue;
        }
        await handlePairingText(event).catch((err) =>
          console.error("[line webhook] pairing handler failed", err)
        );
      }
    }
  } catch (err) {
    console.error("[POST /api/line/webhook] bad payload", err);
  }

  return NextResponse.json({ ok: true });
}

/** LINE's webhook verification button sends a GET-less ping via POST with empty events; keep GET alive for manual checks. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
