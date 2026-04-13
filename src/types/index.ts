export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other";

export interface VocabWord {
  word: string;
  translation: string;
  example: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  phonetic: string;
  partOfSpeech: PartOfSpeech;
}

export interface SnapResponse {
  scene: string;
  vocabulary: VocabWord[];
}

export interface DeckWithWords {
  id: string;
  sceneDesc: string;
  emotionScore: number;
  atmosphere: string;
  ambientSound: string;
  note: string | null;
  colorPalette: string;
  createdAt: string;
  words: WordData[];
}

export interface WordData {
  id: string;
  deckId: string;
  word: string;
  translation: string;
  example: string;
  difficulty: string;
  phonetic: string;
  masteryCount: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: string;
  lastReviewedAt?: string | null;
  deckImage?: string | null;
}

export interface UserStats {
  hearts: number;
  streak: number;
  coins: number;
  wordsLearned: number;
}

export interface UserData {
  id: string;
  name: string;
  hearts: number;
  streak: number;
  coins: number;
  streakFreezeActive: boolean;
  createdAt: string;
  timezone?: string | null;
  lastStreakDate?: string | null;
  lastHeartAt?: string | null;
}

export interface GachaItemData {
  id: string;
  userId: string;
  type: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  emoji: string;
  pulledAt: string;
}

export type Atmosphere = "quiet" | "ambient" | "noisy" | "energizing";
export type AmbientSound = "city" | "office" | "rain" | "cafe" | "transit";

// ─── Unified Learning Path Types ──────────────────────────────────────────────

export interface StudyNode {
  id: string;
  sessionIndex: number;
  targetDurationMin: number;
  estimatedWords: number;
  isLocked: boolean;
  isCompleted: boolean;
  isCheckpoint: boolean;
}

export interface StudyPathResponse {
  nodes: StudyNode[];
  totalDue: number;
  nextCheckpointIndex: number;
  estimatedTotalTimeMin: number;
}

export interface UserStatsResponse {
  hearts: number;
  streak: number;
  coins: number;
  cefrLevel: string | null;
  lastStudiedAt: string | null;
  totalWordsLearned: number;
}

export type SkillType = "flashcards" | "conversation" | "dictation" | "pronunciation" | "fill-blank";

export interface QuestionItem {
  word: WordData;
  skill: SkillType;
  attemptNumber: number; // 1, 2, or 3
}

export interface QuestionResult {
  wordId: string;
  skill: SkillType;
  quality: number; // 0-5
}

export interface SessionStartResponse {
  sessionId: string;
  words: {
    id: string;
    word: string;
    translation: string;
    example: string;
    phonetic: string;
    difficulty: string;
  }[];
  exercisePrompts: {
    conversation: string;
    dictationSentences: string[];
    pronunciationTargets: string[];
  };
}

export interface SkillResult {
  skill: SkillType;
  correct: number;
  total: number;
  vocabularyUsed: string[];
  quality?: number; // exact quality for per-question skills (optional, non-breaking)
}

export interface SessionCompletePayload {
  results: SkillResult[];
  coinsEarned: number;
}

export interface SessionState {
  sessionId: string;
  nodeId: string;
  // Per-question queue (Fix 3)
  questionQueue: QuestionItem[];
  currentQuestionIndex: number;
  completedQuestions: QuestionResult[];
  totalWords: number;
  // Session data
  words: WordData[];
  exercisePrompts: SessionStartResponse["exercisePrompts"];
  startedAt: number;
  progress: number; // 0-100
  skillResults: SkillResult[]; // kept for calculateCoinsEarned
}

export interface WordScore {
  word: string;
  accuracy: number;
  syllableScores: { syllable: string; score: number }[];
}

export interface PronunciationMetrics {
  pronunciationScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore?: number; // Optional - may not always be returned
  detailedResult?: any; // Detailed JSON response with word-level scores
}
