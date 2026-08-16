// Fixed-ladder SRS scheduling for the Living Sandbox (FindWord) loop.
// Pure functions only — no DB, no side effects.

/** Fixed review ladder in days. A word climbs one rung per "Got it"; "Still learning" holds. */
export const LADDER_DAYS = [1, 3, 7, 21, 60] as const;

export type AgeBand = '7-10' | '11-15';

export interface WordSizing {
  /** New words introduced per day. */
  k: number;
  /** Review words per day (queue cap). */
  r: number;
  /** Total daily word set size (k + r). */
  N: number;
}

export interface ReviewableWord {
  id: string;
  nextDueDate: Date | null;
  promotedAt: Date | null;
}

/**
 * Advance one rung on "Got it" (capped at the last rung).
 * "Still learning" holds the current rung — the ladder never moves backward.
 */
export function nextRung(rung: number, gotIt: boolean): number {
  const clamped = Math.min(Math.max(rung, 0), LADDER_DAYS.length - 1);
  if (!gotIt) return clamped;
  return Math.min(clamped + 1, LADDER_DAYS.length - 1);
}

/** Next due date = `from` + LADDER_DAYS[rung] days (rung clamped into range). */
export function nextDueDate(from: Date, rung: number): Date {
  const clamped = Math.min(Math.max(rung, 0), LADDER_DAYS.length - 1);
  const due = new Date(from);
  due.setDate(due.getDate() + LADDER_DAYS[clamped]);
  return due;
}

/** End of the given day (23:59:59.999 local) — words due any time today count as due. */
function endOfDay(day: Date): Date {
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Build today's review queue: promoted words (promotedAt set) whose
 * nextDueDate falls on or before today, oldest due first, capped at `r`.
 * Overflow is simply not returned — it stays due and carries to the next day.
 */
export function buildReviewQueue(
  words: ReviewableWord[],
  today: Date,
  r: number
): ReviewableWord[] {
  const cutoff = endOfDay(today).getTime();
  return words
    .filter(
      (w): w is ReviewableWord & { nextDueDate: Date; promotedAt: Date } =>
        w.promotedAt !== null &&
        w.nextDueDate !== null &&
        w.nextDueDate.getTime() <= cutoff
    )
    .sort((a, b) => a.nextDueDate!.getTime() - b.nextDueDate!.getTime())
    .slice(0, Math.max(0, r));
}

/** Daily word sizing by age band: 7-10 => 4 new + 2 review = 6; 11-15 => 6 + 2 = 8. */
export function sizingForBand(band: AgeBand): WordSizing {
  if (band === '7-10') return { k: 4, r: 2, N: 6 };
  return { k: 6, r: 2, N: 8 };
}

/**
 * Coerce a stored (possibly null/legacy) band value into a valid AgeBand.
 * Existing users without an explicit band default to '11-15'; a numeric age
 * of 10 or under maps to '7-10' as a best-effort fallback.
 */
export function normalizeBand(
  band: string | null | undefined,
  age?: number | null
): AgeBand {
  if (band === '7-10' || band === '11-15') return band;
  if (typeof age === 'number' && age > 0 && age <= 10) return '7-10';
  return '11-15';
}

/** Listen step: passive replays per word — 2 for 7-10, 1 for 11-15. */
export function listenReplaysForBand(band: AgeBand): number {
  return band === '7-10' ? 2 : 1;
}

/** Read/Write step task shape: cloze fill-in for 7-10, free sentence for 11-15. */
export type ReadWriteTask = 'cloze' | 'free-sentence';

export function readWriteTaskForBand(band: AgeBand): ReadWriteTask {
  return band === '7-10' ? 'cloze' : 'free-sentence';
}
