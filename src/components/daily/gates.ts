// Path Picker gate contract for the Living Sandbox daily loop.
// Pure data + pure functions — the daily engine consumes `orderFlexibleSteps`
// to reorder its flexible-step queue after a gate is chosen.

export type FlexibleStepId =
  | "sensory_tags"
  | "listen"
  | "flashcard"
  | "read_write"
  | "dictation";

export type GateId = "sound" | "word" | "quiet";

export const GATE_IDS: readonly GateId[] = ["sound", "word", "quiet"] as const;

export function isGateId(value: unknown): value is GateId {
  return typeof value === "string" && (GATE_IDS as readonly string[]).includes(value);
}

/** The two flexible steps each gate routes the child through first, in order. */
export const GATE_STEPS: Record<GateId, readonly [FlexibleStepId, FlexibleStepId]> = {
  sound: ["listen", "flashcard"],
  word: ["read_write", "sensory_tags"],
  quiet: ["dictation", "sensory_tags"],
};

/**
 * Reorder a flexible-step queue so the chosen gate's steps come first
 * (in gate order), followed by the remaining steps in their existing order.
 * Steps already completed (absent from `queue`) are simply not re-added —
 * gates are starting routes, never requirements.
 */
export function orderFlexibleSteps(
  gate: GateId,
  queue: readonly FlexibleStepId[]
): FlexibleStepId[] {
  const preferred = GATE_STEPS[gate].filter((s) => queue.includes(s));
  const rest = queue.filter((s) => !preferred.includes(s));
  return [...preferred, ...rest];
}

export type AgeBand = "7-10" | "11-15";

export interface GateCopy {
  name: string;
  tagline: string;
  /** Accessible summary of where the gate leads. */
  leadsTo: string;
}

/**
 * Gate naming register per age band — gentler, more storybook for 7-10;
 * plainer for 11-15. Same three gates underneath.
 */
export const GATE_COPY: Record<AgeBand, Record<GateId, GateCopy>> = {
  "7-10": {
    sound: {
      name: "The Humming Gate",
      tagline: "Something is singing in there…",
      leadsTo: "Listening and flip-cards first",
    },
    word: {
      name: "The Letter Garden",
      tagline: "Words grow on the vines here",
      leadsTo: "Reading, writing and touch-words first",
    },
    quiet: {
      name: "The Moss Door",
      tagline: "Shhh… soft and slow",
      leadsTo: "Quiet typing and touch-words first",
    },
  },
  "11-15": {
    sound: {
      name: "Sound Path",
      tagline: "Start with your ears",
      leadsTo: "Listen, then flashcards",
    },
    word: {
      name: "Word Path",
      tagline: "Start with the page",
      leadsTo: "Read/write, then sensory tags",
    },
    quiet: {
      name: "Quiet Path",
      tagline: "Start without a sound",
      leadsTo: "Dictation, then sensory tags",
    },
  },
};
