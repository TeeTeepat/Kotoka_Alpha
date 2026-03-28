import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ZeroBounce statuses that mean the address is unusable
const BLOCKED_STATUSES = new Set(["invalid", "spamtrap", "abuse", "do_not_mail"]);

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ valid: false, message: "Invalid email format" });
  }

  const apiKey = process.env.ZEROBOUNCE_API_KEY;
  if (!apiKey || apiKey === "your_zerobounce_api_key_here") {
    // No API key configured — fall back to format-only check
    return NextResponse.json({ valid: true, status: "format_ok" });
  }

  try {
    const url = `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}&ip_address=`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      // ZeroBounce unreachable — don't block the user
      return NextResponse.json({ valid: true, status: "unknown" });
    }

    const data = await res.json();
    const status: string = data.status ?? "unknown";

    if (BLOCKED_STATUSES.has(status)) {
      const reason =
        status === "invalid" ? "This email address doesn't exist." :
        status === "spamtrap" ? "This email address cannot be used." :
        status === "abuse" ? "This email address is flagged as abusive." :
        "This email address cannot receive mail.";
      return NextResponse.json({ valid: false, status, message: reason });
    }

    // valid / catch-all / unknown → allow
    return NextResponse.json({ valid: true, status });
  } catch {
    // Network error — don't block the user
    return NextResponse.json({ valid: true, status: "unknown" });
  }
}
