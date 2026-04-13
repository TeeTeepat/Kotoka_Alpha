import type { WordData, StudyNode, SkillType } from "@/types";

export type { StudyNode };
export type { SkillType };

type ReviewableWord = { nextReviewAt: string | Date; easeFactor: number };

export const SKILL_ORDER: SkillType[] = [
  "flashcards",
  "conversation",
  "dictation",
  "pronunciation",
];

export const TARGET_DURATION_MIN = 6; // 5-8 min target, default 6
export const ESTIMATED_WORDS_PER_MIN = 1.2; // conservative estimate
export const CHECKPOINT_INTERVAL = 10; // every 10 nodes
export const MAX_VISIBLE_NODES = 50;

/**
 * Sort due words by SM-2 priority:
 * 1. Overdue first (most overdue = highest priority)
 * 2. Then by ease factor ascending (lower ease = harder words = more priority)
 */
export function sortBySM2Priority<T extends ReviewableWord>(words: T[]): T[] {
  const now = Date.now();
  return [...words].sort((a, b) => {
    const aOverdue = now - new Date(a.nextReviewAt).getTime();
    const bOverdue = now - new Date(b.nextReviewAt).getTime();

    // Both overdue: most overdue first
    if (aOverdue > 0 && bOverdue > 0) {
      if (Math.abs(aOverdue - bOverdue) > 60000) return bOverdue - aOverdue;
      return a.easeFactor - b.easeFactor;
    }

    // One overdue, one not: overdue first
    if (aOverdue > 0) return -1;
    if (bOverdue > 0) return 1;

    // Neither overdue: sooner review date first, then lower ease
    const aTime = new Date(a.nextReviewAt).getTime();
    const bTime = new Date(b.nextReviewAt).getTime();
    if (Math.abs(aTime - bTime) > 60000) return aTime - bTime;
    return a.easeFactor - b.easeFactor;
  });
}

/**
 * Estimate how many words fit in a session of given duration
 */
export function estimateWordsForDuration(durationMin: number): number {
  return Math.max(3, Math.min(12, Math.round(durationMin * ESTIMATED_WORDS_PER_MIN)));
}

/**
 * Generate study nodes from due word count.
 * Shows up to 3 completed nodes as visual history, then future nodes.
 */
export function generateNodes(
  totalDueWords: number,
  completedNodeCount: number
): StudyNode[] {
  const wordsPerNode = estimateWordsForDuration(TARGET_DURATION_MIN);
  const nodes: StudyNode[] = [];

  // Prepend up to 3 recent completed nodes as visual history
  const completedVisible = Math.min(completedNodeCount, 3);
  const completedStart = completedNodeCount - completedVisible;
  for (let i = 0; i < completedVisible; i++) {
    const globalIndex = completedStart + i;
    const isCheckpoint = globalIndex > 0 && (globalIndex + 1) % CHECKPOINT_INTERVAL === 0;
    nodes.push({
      id: `node-${globalIndex}`,
      sessionIndex: globalIndex,
      targetDurationMin: TARGET_DURATION_MIN,
      estimatedWords: wordsPerNode,
      isLocked: false,
      isCompleted: true,
      isCheckpoint,
    });
  }

  if (totalDueWords === 0) return nodes;

  // Generate future nodes for remaining due words
  const futurePossible = Math.ceil(totalDueWords / wordsPerNode);
  const futureCount = Math.min(futurePossible, MAX_VISIBLE_NODES - completedVisible);

  for (let i = 0; i < futureCount; i++) {
    const globalIndex = completedNodeCount + i;
    const isCheckpoint = globalIndex > 0 && (globalIndex + 1) % CHECKPOINT_INTERVAL === 0;
    nodes.push({
      id: `node-${globalIndex}`,
      sessionIndex: globalIndex,
      targetDurationMin: TARGET_DURATION_MIN,
      estimatedWords:
        i === futureCount - 1
          ? Math.max(1, totalDueWords - (futureCount - 1) * wordsPerNode)
          : wordsPerNode,
      isLocked: i > 0, // Only first future node is unlocked
      isCompleted: false,
      isCheckpoint,
    });
  }

  return nodes;
}

/**
 * Apply SM-2 algorithm to update word scheduling
 */
export function applySM2Update(
  word: { easeFactor: number; interval: number; masteryCount: number },
  quality: number // 0-5
): { easeFactor: number; interval: number; masteryCount: number; nextReviewAt: string } {
  let { easeFactor, interval, masteryCount } = word;

  if (quality < 3) {
    // Failed: reset interval
    interval = 1;
    masteryCount = Math.max(0, masteryCount - 1);
  } else {
    // Passed: increase interval
    interval = interval <= 1 ? 6 : Math.round(interval * easeFactor);
    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
    masteryCount += 1;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    masteryCount,
    nextReviewAt: nextReviewAt.toISOString(),
  };
}
