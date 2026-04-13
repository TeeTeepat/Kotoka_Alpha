import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;

  const { photos, gps, sessionBehavior, voiceRecording } = await req.json();
  const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;

  const consent = await prisma.userConsent.upsert({
    where: { userId },
    create: { userId, photos: photos ?? true, gps: gps ?? true, sessionBehavior: sessionBehavior ?? true, voiceRecording: voiceRecording ?? false, ipAddress },
    update: { photos: photos ?? true, gps: gps ?? true, sessionBehavior: sessionBehavior ?? true, voiceRecording: voiceRecording ?? false, ipAddress },
  });

  return NextResponse.json({ saved: true, consentedAt: consent.consentedAt.toISOString() });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = session.user.id;
  const consent = await prisma.userConsent.findUnique({ where: { userId } });
  return NextResponse.json(consent ?? null);
}
