// Assert-based self-check for the fixed-ladder SRS.
// Run: npx tsx src/lib/srs/selfcheck.ts

import {
  LADDER_DAYS,
  nextRung,
  nextDueDate,
  buildReviewQueue,
  sizingForBand,
} from './fixedSchedule';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`selfcheck FAILED: ${msg}`);
}

export function demo(): void {
  // --- ladder shape ---
  assert(
    JSON.stringify([...LADDER_DAYS]) === JSON.stringify([1, 3, 7, 21, 60]),
    'ladder days'
  );

  // --- advance: "Got it" climbs one rung, capped at last ---
  assert(nextRung(0, true) === 1, 'advance 0->1');
  assert(nextRung(3, true) === 4, 'advance 3->4');
  assert(nextRung(4, true) === 4, 'advance capped at last rung');

  // --- hold: "Still learning" never moves backward ---
  assert(nextRung(2, false) === 2, 'hold keeps rung');
  assert(nextRung(0, false) === 0, 'hold at bottom');
  assert(nextRung(4, false) === 4, 'hold at top');

  // --- due dates ---
  const base = new Date(2026, 7, 15); // 2026-08-15 local
  assert(nextDueDate(base, 0).getDate() === 16, 'rung 0 => +1 day');
  const r2 = nextDueDate(base, 2);
  assert(r2.getMonth() === 7 && r2.getDate() === 22, 'rung 2 => +7 days');
  const r4 = nextDueDate(base, 4);
  assert(r4.getMonth() === 9 && r4.getDate() === 14, 'rung 4 => +60 days');

  // --- queue: promoted + due only, oldest first, capped at r ---
  const today = new Date(2026, 7, 15);
  const d = (day: number) => new Date(2026, 7, day);
  const words = [
    { id: 'a', nextDueDate: d(14), promotedAt: d(10) }, // due yesterday
    { id: 'b', nextDueDate: d(12), promotedAt: d(9) }, // oldest due
    { id: 'c', nextDueDate: d(15), promotedAt: d(11) }, // due today
    { id: 'd', nextDueDate: d(20), promotedAt: d(11) }, // not due yet
    { id: 'e', nextDueDate: d(13), promotedAt: null }, // never promoted
    { id: 'f', nextDueDate: null, promotedAt: d(11) }, // no due date
  ];

  const q = buildReviewQueue(words, today, 2);
  assert(q.length === 2, 'queue capped at r=2');
  assert(q[0].id === 'b' && q[1].id === 'a', 'oldest-due-first order');

  // --- overflow carries to next day ---
  const uncapped = buildReviewQueue(words, today, 10);
  assert(
    uncapped.map((w) => w.id).join(',') === 'b,a,c',
    'due set today is b,a,c'
  );
  const tomorrow = new Date(2026, 7, 16);
  const qTomorrow = buildReviewQueue(
    words.filter((w) => w.id !== 'b' && w.id !== 'a'), // reviewed today
    tomorrow,
    2
  );
  assert(qTomorrow.length === 1 && qTomorrow[0].id === 'c', 'overflow word c carries to tomorrow');

  // --- sizing ---
  const young = sizingForBand('7-10');
  assert(young.k === 4 && young.r === 2 && young.N === 6, 'sizing 7-10');
  const older = sizingForBand('11-15');
  assert(older.k === 6 && older.r === 2 && older.N === 8, 'sizing 11-15');

  console.log('selfcheck OK: all assertions passed');
}

demo();
