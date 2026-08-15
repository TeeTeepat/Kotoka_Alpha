import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Marks the pending Peak B (overnight reveal) as seen: clears
 * User.peakBPendingAt so the settle animation plays exactly once.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { peakBPendingAt: null },
  });

  return NextResponse.json({ ok: true });
}
