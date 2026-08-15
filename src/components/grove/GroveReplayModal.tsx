"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, X } from "lucide-react";
import Silhouette from "@/components/world/Silhouette";
import { resolveAmbientUrl } from "@/lib/ambientSounds";
import { getTimeOfDay, getWorldTint } from "@/lib/compositing";
import type { GroveWord } from "./types";

interface GroveReplayModalProps {
  word: GroveWord | null;
  onClose: () => void;
}

/**
 * Replay one promoted word: its photo card tinted by the current time of
 * day, its "because…" line, and its ambient sound if it has one. Outside
 * the session loop — no grading, no progress, close whenever.
 */
export default function GroveReplayModal({ word, onClose }: GroveReplayModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const ambientUrl = useMemo(
    () => resolveAmbientUrl(word?.ambientSoundUrl ?? word?.deckAmbientSound),
    [word]
  );

  const tint = useMemo(() => getWorldTint(getTimeOfDay(), "clear"), []);

  // Ambient bed: starts softly when the card opens, stops on close.
  useEffect(() => {
    if (!word || !ambientUrl) return;
    const audio = new Audio(ambientUrl);
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      setPlaying(false);
    };
  }, [word, ambientUrl]);

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <AnimatePresence>
      {word && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-dark/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-sm rounded-3xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo card, tinted by the current time of day */}
            <div className="relative w-full aspect-[4/3] bg-primary/5 flex items-center justify-center overflow-hidden">
              {word.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={word.photoUrl}
                  alt={word.word}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Silhouette
                  bodyPlan={word.bodyPlan}
                  size={word.sensorySize}
                  texture={word.sensoryTextures?.[0]}
                />
              )}
              {/* Time-of-day wash */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-soft-light"
                style={{ background: tint.background, opacity: 0.55 }}
              />
              {tint.darkGround && (
                <div className="absolute inset-0 pointer-events-none bg-dark/25" />
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center shadow-md"
              >
                <X className="w-4 h-4 text-dark" />
              </button>

              {ambientUrl && (
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={playing ? "Mute ambient sound" : "Play ambient sound"}
                  className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center shadow-md"
                >
                  {playing ? (
                    <Volume2 className="w-4 h-4 text-primary" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              )}
            </div>

            <div className="p-5">
              <p className="font-heading font-extrabold text-2xl text-dark">
                {word.word}
              </p>
              {word.translation && (
                <p className="font-body text-sm text-gray-400 mt-0.5">
                  {word.translation}
                </p>
              )}
              {word.becauseText && (
                <p className="font-body text-sm text-dark/70 mt-3 leading-relaxed">
                  {word.becauseText}
                </p>
              )}
              {word.locationName && (
                <p className="font-body text-xs text-gray-400 mt-3">
                  {word.locationName}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
