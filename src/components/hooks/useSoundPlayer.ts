"use client";

import { useRef, useCallback, useEffect } from "react";

type SoundEffect = "correct" | "wrong" | "coin" | "fanfare" | "pop" | "click" | "unlock" | "heart-break";

/**
 * Maps Kotoka game events → snd-lib built-in sound keys (Kit 01).
 *
 * Available keys: button, caution, celebration, disabled, notification,
 * progress_loop, ringtone_loop, select, swipe, tap, toggle_on, toggle_off,
 * transition_down, transition_up, type
 */
const SOUND_MAP: Record<SoundEffect, string> = {
  correct:       "select",
  wrong:         "caution",
  coin:          "notification",
  fanfare:       "celebration",
  pop:           "tap",
  click:         "button",
  unlock:        "transition_up",
  "heart-break": "disabled",
};

// Module-level singleton so multiple hook instances share one loaded instance
let sndInstance: import("snd-lib").default | null = null;
let loadPromise: Promise<void> | null = null;

function getSnd(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = import("snd-lib").then(({ default: Snd }) => {
    const snd = new Snd({ easySetup: true, muteOnWindowBlur: false });
    return snd.load("01").then(() => {
      sndInstance = snd;
    });
  }).catch(() => {
    // CDN unavailable or blocked — sounds silently disabled
    loadPromise = null;
  });
  return loadPromise;
}

/**
 * Sound player hook powered by snd-lib (Kit 01 sprite from jsDelivr CDN).
 *
 * Mobile unlock is handled automatically via snd-lib's easySetup option
 * (listens for first DOM interaction). All sounds are best-effort —
 * every gamification trigger must have visual feedback that works without sound.
 */
export function useSoundPlayer() {
  useEffect(() => {
    if (typeof window !== "undefined") getSnd();
  }, []);

  const play = useCallback((effect: SoundEffect) => {
    if (!sndInstance) return;
    const key = SOUND_MAP[effect];
    try {
      sndInstance.play(key, { volume: 0.4 });
    } catch {
      // Silently swallow — sounds are best-effort
    }
  }, []);

  return { play };
}
