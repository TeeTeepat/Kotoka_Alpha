/** Normalized (0-1) crop box into a word's original photo. */
export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  sceneDesc: string | null;
  /** Bounding box of this word's object within photoUrl, normalized 0-1.
   *  Null for decks captured before cropBox existed — callers must fall
   *  back to showing the full photo. */
  cropBox: CropBox | null;
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
