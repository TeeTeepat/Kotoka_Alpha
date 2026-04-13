import type { SessionState, SkillType, SkillResult, WordData, QuestionItem, QuestionResult } from "@/types";

const STORAGE_KEY = "kotoka_session_state";

const ALL_SKILLS: SkillType[] = ["flashcards", "dictation", "pronunciation", "fill-blank", "conversation"];

function randomSkill(): SkillType {
  return ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createSessionState(
  sessionId: string,
  nodeId: string,
  words: WordData[],
  exercisePrompts: SessionState["exercisePrompts"]
): SessionState {
  const questionQueue: QuestionItem[] = shuffle(
    words.map((word) => ({ word, skill: randomSkill(), attemptNumber: 1 }))
  );

  return {
    sessionId,
    nodeId,
    questionQueue,
    currentQuestionIndex: 0,
    completedQuestions: [],
    totalWords: words.length,
    words,
    exercisePrompts,
    startedAt: Date.now(),
    progress: 0,
    skillResults: [],
  };
}

export function saveSessionToStorage(state: SessionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore storage errors */ }
}

export function loadSessionFromStorage(): SessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SessionState;
    // Expire after 24h
    if (Date.now() - state.startedAt > 24 * 60 * 60 * 1000) {
      clearSessionStorage();
      return null;
    }
    // Discard old-format sessions (pre-Fix3 without questionQueue)
    if (!state.questionQueue?.length) {
      clearSessionStorage();
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function clearSessionStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * Advance to the next question after a quality score.
 * If quality < 3 and attempt < 3, re-queues word with a new random skill.
 */
export function advanceQuestion(state: SessionState, quality: number): SessionState {
  const current = state.questionQueue[state.currentQuestionIndex];
  if (!current) return state;

  const result: QuestionResult = { wordId: current.word.id, skill: current.skill, quality };
  const completedQuestions = [...state.completedQuestions, result];

  let newQueue = [...state.questionQueue];

  // Wrong AND under attempt cap: requeue with a different random skill
  if (quality < 3 && current.attemptNumber < 3) {
    const wordAttempts = completedQuestions.filter((q) => q.wordId === current.word.id).length;
    if (wordAttempts < 3) {
      newQueue.push({
        word: current.word,
        skill: randomSkill(),
        attemptNumber: current.attemptNumber + 1,
      });
    }
  }

  const nextIndex = state.currentQuestionIndex + 1;
  const progress = Math.round((nextIndex / Math.max(newQueue.length, 1)) * 100);

  // Update legacy skillResults for calculateCoinsEarned
  const skillResults = [...state.skillResults];
  const existingIdx = skillResults.findIndex((r) => r.skill === current.skill);
  if (existingIdx >= 0) {
    skillResults[existingIdx] = {
      ...skillResults[existingIdx],
      correct: skillResults[existingIdx].correct + (quality >= 3 ? 1 : 0),
      total: skillResults[existingIdx].total + 1,
    };
  } else {
    skillResults.push({
      skill: current.skill,
      correct: quality >= 3 ? 1 : 0,
      total: 1,
      vocabularyUsed: [current.word.word],
    });
  }

  const newState: SessionState = {
    ...state,
    questionQueue: newQueue,
    completedQuestions,
    currentQuestionIndex: nextIndex,
    progress,
    skillResults,
  };

  saveSessionToStorage(newState);
  return newState;
}

export function isSessionComplete(state: SessionState): boolean {
  return state.currentQuestionIndex >= state.questionQueue.length;
}

export function calculateCoinsEarned(
  results: { correct: number; total: number }[],
  streak: number
): number {
  const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
  const totalQuestions = results.reduce((s, r) => s + r.total, 0);
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  let coins = 5;
  if (accuracy >= 1) coins += 10;
  coins += Math.min(streak * 2, 20);

  return coins;
}
