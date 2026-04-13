import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const items = await prisma.gachaItem.findMany({
    where: { userId },
    orderBy: { pulledAt: "desc" },
  });

  return NextResponse.json(items);
}
