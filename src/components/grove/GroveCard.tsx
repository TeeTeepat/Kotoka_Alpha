"use client";

import { motion } from "framer-motion";
import Silhouette from "@/components/world/Silhouette";
import { ShimmerGlow } from "@/components/world/ShimmerOverlay";
import type { GroveWord } from "./types";

interface GroveCardProps {
  word: GroveWord;
  shimmer: boolean;
  onOpen: (word: GroveWord) => void;
}

/**
 * One promoted word in the Grove grid. Photo if it has one, otherwise its
 * silhouette. No numbers, no progress — just the word, replayable anytime.
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
