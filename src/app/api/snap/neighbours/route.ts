import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { identifyObject, neighbours } from "@/lib/neighbours";
import { sizingForBand, normalizeBand } from "@/lib/srs/fixedSchedule";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as {
      imageBase64?: unknown;
      label?: unknown;
    } | null;
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : null;
    // A confirmed/corrected label (alternate tap or text search) skips
    // identification and just regenerates the neighbour set.
    const givenLabel =
      typeof body?.label === "string" && body.label.trim()
        ? body.label.trim().toLowerCase()
        : null;
    if (!imageBase64 && !givenLabel) {
      return NextResponse.json(
        { error: "imageBase64 or label is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cefrLevel: true, age: true, ageBand: true },
    });

    const cefr = user?.cefrLevel ?? "A1";
    const { k } = sizingForBand(normalizeBand(user?.ageBand, user?.age));

    let label: string;
    let alternates: [string, string];
    if (givenLabel) {
      label = givenLabel;
      alternates = ["thing", "item"];
    } else {
      ({ label, alternates } = await identifyObject(imageBase64!));
    }
    const words = await neighbours(label, cefr, k);

    return NextResponse.json({ label, alternates, words });
  } catch (err) {
    console.error("[POST /api/snap/neighbours]", err);
    return NextResponse.json(
      { error: "Failed to identify object" },
      { status: 500 }
    );
  }
}
