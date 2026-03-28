export interface VocabWord {
  word: string;
  translation: string;
  example: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  phonetic: string;
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
