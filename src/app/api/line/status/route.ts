import { NextResponse } from "next/server";

/** Whether LINE push credentials are set up (does not leak the values). */
export async function GET() {
  // Pairing flow links the parent userId at runtime, so only the push token is required.
  const configured = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const webhookReady = !!process.env.LINE_CHANNEL_SECRET;
  return NextResponse.json({ configured, webhookReady });
}
