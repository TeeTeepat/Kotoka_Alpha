"use client";

import { motion } from "framer-motion";
import { ShimmerGlow } from "@/components/world/ShimmerOverlay";
import CropThumb from "./CropThumb";
import type { GroveWord } from "./types";

interface GroveCardProps {
  word: GroveWord;
  shimmer: boolean;
  onOpen: (word: GroveWord) => void;
}

/**
 * One promoted word in the Journal grid: a crop of the object from its
 * original photo (falls back to the full photo, then a silhouette, when
 * no cropBox has been recorded yet). No numbers, no progress — just the
 * word, replayable anytime.
 */
export default function GroveCard({ word, shimmer, onOpen }: GroveCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onOpen(word)}
      className="relative text-left rounded-2xl bg-white border border-card-border shadow-card overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="relative w-full aspect-square bg-primary/5 flex items-center justify-center overflow-hidden">
        {shimmer && <ShimmerGlow size={90} />}
        <CropThumb
          photoUrl={word.photoUrl}
          cropBox={word.cropBox}
          word={word.word}
          bodyPlan={word.bodyPlan}
          sensorySize={word.sensorySize}
          texture={word.sensoryTextures?.[0]}
          className="w-full h-full"
        />
      </div>
      <div className="p-2.5">
        <p className="font-heading font-extrabold text-sm text-dark truncate">
          {word.word}
        </p>
        {word.translation && (
          <p className="font-body text-xs text-gray-400 truncate">
            {word.translation}
          </p>
        )}
      </div>
    </motion.button>
  );
}
