export interface WorldCollectible {
  id: string;
  wordId: string;
  posX: number;
  posY: number;
  dim: boolean;
  settledPhotoUrl: string | null;
  settledAt: string | null;
  createdAt: string;
  word: string;
  translation: string | null;
  bodyPlan: string | null;
  sensorySize: string | null;
  sensoryTextures: string[];
  photoUrl: string | null;
  /** Topic bucket (deck atmosphere) used for shimmer matching. */
  topic: string | null;
}

export interface WorldPeakBPending {
  pendingAt: string;
  word: string | null;
  photoUrl: string | null;
}

export interface WorldStateResponse {
  weather: string;
  collectibles: WorldCollectible[];
  /** Set when the settle beat (Peak B) is owed as an overnight reveal. */
  peakB: WorldPeakBPending | null;
}
