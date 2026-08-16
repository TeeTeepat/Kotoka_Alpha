import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  sendAudioMessage,
  sendFlexReport,
  sendStepReport,
  type StepReport,
} from "@/lib/line";

type StepReportBody = Partial<StepReport> & {
  stepsDone?: unknown;
  totalSteps?: unknown;
  pronScore?: unknown;
  voiceClipId?: unknown;
};

function asNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : fallback;
}

function asPercent(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100
    ? value
    : undefined;
}

function localDayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getJournalGotIt(payload: unknown): boolean | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const gotIt = (payload as Record<string, unknown>).gotIt;
  return typeof gotIt === "boolean" ? gotIt : undefined;
}

async function getTodayReviewAccuracy(userId: string, start: Date, end: Date): Promise<number | undefined> {
  try {
    // Self-report currently updates Word directly, but this also supports any
    // existing journal rows that use the conventional self_report/gotIt shape.
    const entries = await prisma.journalEntry.findMany({
      where: { userId, kind: "self_report", createdAt: { gte: start, lt: end } },
      select: { payload: true },
    });
    const reports = entries
      .map((entry) => getJournalGotIt(entry.payload))
      .filter((gotIt): gotIt is boolean => typeof gotIt === "boolean");
    return reports.length
      ? Math.round((reports.filter(Boolean).length / reports.length) * 100)
      : undefined;
  } catch (err) {
    console.error("[daily step report] review accuracy lookup failed", err);
    return undefined;
  }
}

/**
 * Fire-and-forget LINE demo hook for the daily loop. The client calls this
 * after each step (and after loop completion) without awaiting the result —
 * a LINE send failure (or LINE not configured) must never block the loop.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as StepReportBody | null;
    const event = body?.event === "loop_complete" ? "loop_complete" : "step_complete";

    // Prefer the paired parent's LINE userId; sendStepReport falls back to
    // LINE_DEMO_PARENT_USER_ID when this is unset.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lineParentUserId: true, name: true },
    });

    const report: StepReport = {
      event,
      stepName: typeof body?.stepName === "string" ? body.stepName : undefined,
      wordsLearned: Array.isArray(body?.wordsLearned)
        ? body!.wordsLearned!.filter((w): w is string => typeof w === "string")
        : undefined,
      kidName: typeof body?.kidName === "string" ? body.kidName : undefined,
      to: user?.lineParentUserId ?? undefined,
    };

    if (event === "loop_complete") {
      const now = new Date();
      const todayStart = localDayStart(now);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);

      // Word has no createdAt field; follow the existing parent summary's
      // ownership model and count words contained in decks made this week.
      const [reviewAccuracy, wordsThisWeek, decksThisWeek] = await Promise.all([
        getTodayReviewAccuracy(userId, todayStart, tomorrowStart),
        prisma.word
          .count({ where: { deck: { userId, createdAt: { gte: weekStart } } } })
          .catch((err) => {
            console.error("[daily step report] weekly word lookup failed", err);
            return 0;
          }),
        prisma.deck
          .findMany({
            where: { userId, createdAt: { gte: weekStart } },
            select: { createdAt: true },
          })
          .catch((err) => {
            console.error("[daily step report] weekly activity lookup failed", err);
            return [];
          }),
      ]);
      const activeDaysThisWeek = new Set(
        decksThisWeek.map((deck) => localDayStart(deck.createdAt).toISOString())
      ).size;
      const sent = await sendFlexReport({
        kidName: report.kidName ?? user?.name ?? "Your learner",
        date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(now),
        pronScore: asPercent(body?.pronScore),
        reviewAccuracy,
        stepsDone: asNonNegativeInteger(body?.stepsDone, 0),
        totalSteps: asNonNegativeInteger(body?.totalSteps, 8),
        wordsToday: report.wordsLearned ?? [],
        wordsThisWeek,
        activeDaysThisWeek,
        to: report.to,
      });

      const voiceClipId = typeof body?.voiceClipId === "string" ? body.voiceClipId : undefined;
      if (voiceClipId) {
        // Only push a clip that actually exists and belongs to this user —
        // the GET route is unauthenticated, so leaking another user's clip
        // id here would let it be pushed to a stranger's LINE. A missing or
        // unowned clip must not block the rest of the report.
        const ownedClip = await prisma.voiceClip
          .findUnique({ where: { id: voiceClipId }, select: { userId: true, durationMs: true } })
          .then((clip) => (clip && clip.userId === userId ? clip : null))
          .catch((err) => {
            console.error("[daily step report] voice clip lookup failed", err);
            return null;
          });
        if (ownedClip) {
          await sendAudioMessage(
            `${process.env.PUBLIC_BASE_URL}/api/voice-clip/${voiceClipId}`,
            ownedClip.durationMs,
            report.to
          );
        }
      }

      return NextResponse.json({ ok: sent });
    }

    // Awaited here (serverless functions can be frozen right after the
    // response is sent, so a detached promise may never finish) — but the
    // client that calls this route never awaits it, so the loop UX never
    // blocks on LINE. A LINE failure is swallowed either way.
    const sent = await sendStepReport(report).catch(() => false);

    return NextResponse.json({ ok: sent });
  } catch (err) {
    console.error("[POST /api/daily/step-report]", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
