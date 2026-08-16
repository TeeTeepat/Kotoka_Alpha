"use client";

import { useEffect, useRef, useState } from "react";
import { resolveAmbientUrl } from "@/lib/ambientSounds";

/**
 * Minimal ambient audio loop for the atmospheric flashcard. Deliberately
 * not AmbientPlayer: that component indexes SOUND_LIBRARY by id and falls
 * back to Office Hum for anything unrecognized, which would mislabel every
 * deck stored with a loose tag (Deck.ambientSound defaults to "cafe", not
 * an id). resolveAmbientUrl already handles ids, raw URLs, and loose tags,
 * returning null when nothing matches — we simply stay silent then.
 *
 * Autoplay is tied to a user gesture (card flip), not mount, since browsers
 * block unprompted audio.
 */
export function useAtmosphereSound(soundValue: string | null | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const url = resolveAmbientUrl(soundValue);

  useEffect(() => {
    setPlaying(false);
    if (!url) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url]);

  const start = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  };

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  return { available: !!url, playing, start, stop };
}
