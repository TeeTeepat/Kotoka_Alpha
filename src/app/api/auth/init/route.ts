import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const cookieStore = await cookies();
  const session = await auth();

  let userId: string;

  if (session?.user?.email) {
    // Logged in via NextAuth — find the real user record by email
    const nextAuthUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (nextAuthUser) {
      userId = nextAuthUser.id;
    } else {
      // Edge case: session exists but no DB record yet
      const created = await prisma.user.create({
        data: { email: session.user.email, name: session.user.name },
      });
      userId = created.id;
    }
  } else {
    // Anonymous visitor — reuse existing kotoka-uid or create a fresh one
    const existingId = cookieStore.get("kotoka-uid")?.value;
    let user = existingId
      ? await prisma.user.findUnique({ where: { id: existingId } })
      : null;
    if (!user) {
      user = await prisma.user.create({ data: {} });
    }
    userId = user.id;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const res = NextResponse.json(user);
  res.cookies.set("kotoka-uid", userId, {
    httpOnly: true,
    path: "/",
    maxAge: 365 * 24 * 3600,
    sameSite: "lax",
  });
  return res;
}
