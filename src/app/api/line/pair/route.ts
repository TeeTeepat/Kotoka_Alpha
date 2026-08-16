import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const PAIR_CODE_TTL_MS = 15 * 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Current pairing status for the signed-in parent's account. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lineParentUserId: true, linePairCode: true, linePairCodeExpiresAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const connected = !!user.lineParentUserId;
  const codeActive =
    !!user.linePairCode &&
    !!user.linePairCodeExpiresAt &&
    user.linePairCodeExpiresAt.getTime() > Date.now();

  return NextResponse.json({
    connected,
    code: codeActive ? user.linePairCode : null,
    expiresAt: codeActive ? user.linePairCodeExpiresAt : null,
  });
}

/** Issues a fresh 6-digit pairing code, valid for 15 minutes. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + PAIR_CODE_TTL_MS);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { linePairCode: code, linePairCodeExpiresAt: expiresAt },
  });

  return NextResponse.json({ code, expiresAt });
}
