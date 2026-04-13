import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAutoTag } from "@/lib/autoSensoryTag";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { scene_context, lat, lng, image } = await req.json();
  if (!scene_context) return NextResponse.json({ error: "scene_context required" }, { status: 400 });
  const result = await generateAutoTag(
    scene_context as string,
    lat as number | undefined,
    lng as number | undefined,
    image as string | undefined
  );
  return NextResponse.json(result);
}
