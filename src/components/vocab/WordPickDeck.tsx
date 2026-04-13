"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VocabWord, PartOfSpeech } from "@/types";
import WordPickCard from "./WordPickCard";

const MAX_KEEP = 5;

function buildSummaryLine(words: VocabWord[]): string {
  const counts = words.reduce((acc, w) => {
    acc[w.partOfSpeech] = (acc[w.partOfSpeech] ?? 0) + 1;
    return acc;
  }, {} as Record<PartOfSpeech, number>);

  const parts: string[] = [];
  if (counts.noun) parts.push(`${counts.noun} noun${counts.noun > 1 ? "s" : ""}`);
  if (counts.verb) parts.push(`${counts.verb} verb${counts.verb > 1 ? "s" : ""}`);
  if (counts.adjective) parts.push(`${counts.adjective} adj`);
  if (counts.adverb) parts.push(`${counts.adverb} adv`);
  const other = (counts.phrase ?? 0) + (counts.other ?? 0);
  if (other) parts.push(`${other} other`);
  return parts.join(" · ");
}

interface WordPickDeckProps {
  words: VocabWord[];
  onComplete: (kept: VocabWord[]) => void;
}

export default function WordPickDeck({ words, onComplete }: WordPickDeckProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else if (next.size < MAX_KEEP) {
        next.add(index);
      }
      return next;
    });
  };

  const selectedCount = selected.size;
  const summaryLine = buildSummaryLine(words);
  const kept = Array.from(selected)
    .sort((a, b) => a - b)
    .map((i) => words[i]);

  return (
    <div className="space-y-4">
      {/* Sticky header — progress bar */}
      <div className="card-base p-3 sticky top-0 z-10">
        <p className="font-body text-xs text-gray-500 mb-2">
          🌟 Koko found {words.length} words · {summaryLine}
        </p>
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-xs text-gray-400">
            {selectedCount < MAX_KEEP
              ? `Pick ${MAX_KEEP - selectedCount} more`
              : "5 / 5 selected"}
          </span>
          <span className="font-heading font-bold text-xs text-primary">
            {selectedCount} / {MAX_KEEP}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <motion.div
            className="bg-primary h-1.5 rounded-full"
            animate={{ width: `${(selectedCount / MAX_KEEP) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Scrollable word list */}
      <div className="space-y-3">
        {words.map((word, i) => (
          <WordPickCard
            key={word.word + i}
            word={word}
            isSelected={selected.has(i)}
            isDisabled={!selected.has(i) && selectedCount >= MAX_KEEP}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>

      {/* Create Deck button — appears once ≥1 selected */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="sticky bottom-4"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onComplete(kept)}
              className="btn-aqua w-full py-4 shadow-lg"
            >
              Save {selectedCount} word{selectedCount > 1 ? "s" : ""} →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
