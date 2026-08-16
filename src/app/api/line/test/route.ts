import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendStepReport } from "@/lib/line";

/** Sends a one-off "connection works" push to the paired parent (or the env fallback). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lineParentUserId: true },
  });

  const ok = await sendStepReport({
    event: "test",
    kidName: session.user.name ?? undefined,
    to: user?.lineParentUserId ?? undefined,
  });
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "LINE not configured or send failed. Pair via the code above, or set LINE_CHANNEL_ACCESS_TOKEN (+ LINE_DEMO_PARENT_USER_ID fallback)." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
