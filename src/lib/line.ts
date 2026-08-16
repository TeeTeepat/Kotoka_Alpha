// LINE parent-report sender. Implementation lands with the Parent-tab workstream;
// callers can use this immediately.
// ponytail: demo-grade — parent userId comes from LINE_DEMO_PARENT_USER_ID env,
// upgrade path is webhook follow-event capture per workspace/LINE-SETUP-GUIDE.md.

export type StepReport = {
  event: "step_complete" | "loop_complete" | "test";
  stepName?: string;
  wordsLearned?: string[];
  minutesSpent?: number;
  kidName?: string;
  /**
   * LINE userId to push to. Resolution order when omitted: caller should
   * look up the session user's lineParentUserId (paired via the webhook)
   * and pass it explicitly; if that's also unset, this falls back to
   * LINE_DEMO_PARENT_USER_ID.
   */
  to?: string;
};

export type FlexReportData = {
  kidName: string;
  date: string;
  pronScore?: number;
  reviewAccuracy?: number;
  stepsDone: number;
  totalSteps: number;
  wordsToday: string[];
  wordsThisWeek: number;
  activeDaysThisWeek: number;
  to?: string;
};

type LinePushMessage = Record<string, unknown>;

function clampPercent(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}

async function sendPushMessage(
  to: string | undefined,
  message: LinePushMessage
): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const recipient = to || process.env.LINE_DEMO_PARENT_USER_ID;
  if (!token || !recipient) return false; // not configured yet — silently skip

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: recipient, messages: [message] }),
    });
    if (!res.ok) {
      console.error("[LINE push] API returned", res.status);
    }
    return res.ok;
  } catch (err) {
    console.error("[LINE push] failed", err);
    return false;
  }
}

export async function sendStepReport(report: StepReport): Promise<boolean> {
  const lines = [
    `🌱 Kotoka report${report.kidName ? ` — ${report.kidName}` : ""}`,
    report.event === "loop_complete"
      ? "Finished today's learning loop! 🎉"
      : report.event === "test"
        ? "Test message — LINE connection works!"
        : `Completed step: ${report.stepName ?? "a learning step"}`,
    report.wordsLearned?.length
      ? `Words: ${report.wordsLearned.join(", ")}`
      : "",
    report.minutesSpent ? `Time: ${report.minutesSpent} min` : "",
  ].filter(Boolean);

  return sendPushMessage(report.to, { type: "text", text: lines.join("\n") });
}

/** Send the richer end-of-loop report to the paired parent. */
export async function sendFlexReport(data: FlexReportData): Promise<boolean> {
  const pronunciation = clampPercent(data.pronScore);
  const review = clampPercent(data.reviewAccuracy);
  const scoreLabel = (score: number | undefined) =>
    typeof score === "number" && Number.isFinite(score) ? `${clampPercent(score)}%` : "—";
  const progressBar = (score: number) => ({
    type: "box",
    layout: "horizontal",
    height: "8px",
    backgroundColor: "#E6F7F6",
    cornerRadius: "8px",
    contents: [
      {
        type: "box",
        layout: "vertical",
        width: `${score}%`,
        backgroundColor: "#2BB8B3",
        cornerRadius: "8px",
        contents: [],
      },
    ],
  });
  const metric = (label: string, value: number | undefined, barValue: number) => ({
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: label, size: "sm", color: "#3D5554", flex: 1 },
          { type: "text", text: scoreLabel(value), size: "sm", weight: "bold", color: "#173B39" },
        ],
      },
      progressBar(barValue),
    ],
  });
  const words = data.wordsToday.slice(0, 12).map((word) => ({
    type: "box",
    layout: "vertical",
    backgroundColor: "#E6F7F6",
    cornerRadius: "999px",
    paddingAll: "6px",
    margin: "xs",
    contents: [{ type: "text", text: word, size: "xs", color: "#166B67", wrap: true }],
  }));
  const altText = [
    `${data.kidName} · ${data.date}`,
    `Pronunciation ${scoreLabel(data.pronScore)} · Review ${scoreLabel(data.reviewAccuracy)}`,
    `Steps ${data.stepsDone}/${data.totalSteps} ✓`,
    data.wordsToday.length ? `Words: ${data.wordsToday.join(", ")}` : "No words recorded today",
    `This week: ${data.wordsThisWeek} words · ${data.activeDaysThisWeek} active days`,
  ].join("\n");

  return sendPushMessage(data.to, {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#E6F7F6",
        paddingAll: "16px",
        contents: [
          { type: "text", text: `🌱 ${data.kidName} · ${data.date}`, weight: "bold", size: "lg", color: "#173B39", wrap: true },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "16px",
        contents: [
          metric("Pronunciation", data.pronScore, pronunciation),
          metric("Review", data.reviewAccuracy, review),
          { type: "separator", color: "#E6F7F6" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: `Steps ${data.stepsDone}/${data.totalSteps} ✓`, weight: "bold", color: "#173B39", flex: 1 },
              { type: "text", text: "Today's words", size: "xs", color: "#5D7674" },
            ],
          },
          // Note: Flex `box` has no `wrap` property (only `text` does) — LINE's
          // validate endpoint rejects it with "unknown field". Chips beyond the
          // bubble width will be clipped by the horizontal box, not wrapped.
          words.length
            ? { type: "box", layout: "horizontal", contents: words }
            : { type: "text", text: "No words recorded today", size: "sm", color: "#5D7674" },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#F7FBFB",
        paddingAll: "14px",
        contents: [
          { type: "text", text: `This week: ${data.wordsThisWeek} words · ${data.activeDaysThisWeek} active days`, size: "sm", color: "#3D5554", wrap: true },
        ],
      },
    },
  });
}

/** Send the just-recorded pronunciation clip after the loop report. */
export async function sendAudioMessage(
  originalContentUrl: string,
  duration: number,
  to?: string
): Promise<boolean> {
  return sendPushMessage(to, {
    type: "audio",
    originalContentUrl,
    duration: Math.max(1, Math.round(duration)),
  });
}

/** Reply to a webhook event using its one-time reply token (no push quota cost). */
export async function replyMessage(replyToken: string, text: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return false;

  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  });
  return res.ok;
}
