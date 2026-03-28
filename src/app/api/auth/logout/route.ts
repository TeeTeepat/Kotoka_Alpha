import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  const res = NextResponse.json({ ok: true });

  // Clear the anonymous/linked user cookie so data doesn't bleed between sessions
  res.cookies.set("kotoka-uid", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  // Also clear any leftover init flag
  const existing = cookieStore.get("kotoka-uid");
  if (!existing) {
    // already gone
  }

  return res;
}
