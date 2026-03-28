import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kotoka-uid")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const items = await prisma.gachaItem.findMany({
    where: { userId },
    orderBy: { pulledAt: "desc" },
  });

  return NextResponse.json(items);
}
