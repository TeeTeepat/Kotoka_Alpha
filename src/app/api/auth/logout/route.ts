import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Sign out from NextAuth
  await signOut();

  return NextResponse.json({ ok: true });
}
