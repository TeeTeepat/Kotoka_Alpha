export interface GroveWord {
  id: string;
  word: string;
  translation: string | null;
  becauseText: string | null;
  photoUrl: string | null;
  ambientSoundUrl: string | null;
  bodyPlan: string | null;
  sensorySize: string | null;
  sensoryTextures: string[];
  promotedAt: string | null;
  topic: string | null;
  deckAmbientSound: string | null;
  locationName: string | null;
}

export interface GroveShimmer {
  topic: string;
  cefrBand: string;
  earnedAt: string;
}

export interface GroveResponse {
  words: GroveWord[];
  shimmers: GroveShimmer[];
}
