"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { VocabWord, PartOfSpeech } from "@/types";

const POS_COLORS: Record<PartOfSpeech, string> = {
  noun: "bg-blue-100 text-blue-700",
  verb: "bg-green-100 text-green-700",
  adjective: "bg-purple-100 text-purple-700",
  adverb: "bg-orange-100 text-orange-700",
  phrase: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600",
};

interface WordPickCardProps {
  word: VocabWord;
  isSelected: boolean;
  isDisabled: boolean; // true when 5 already selected and this one isn't
  onToggle: () => void;
}

export default function WordPickCard({
  word,
  isSelected,
  isDisabled,
  onToggle,
}: WordPickCardProps) {
  const posColor = POS_COLORS[word.partOfSpeech] ?? POS_COLORS.other;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={isDisabled}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      animate={{ opacity: isDisabled ? 0.45 : 1 }}
      transition={{ duration: 0.15 }}
      className={`w-full text-left card-base p-4 transition-all ${
        isSelected
          ? "ring-2 ring-primary bg-primary/5"
          : isDisabled
          ? "cursor-not-allowed"
          : "hover:ring-1 hover:ring-primary/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <div
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-primary border-primary"
              : "border-gray-300"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-extrabold text-lg text-dark">{word.word}</span>
            <span className="font-body text-xs text-gray-400">{word.phonetic}</span>
            <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full ${posColor}`}>
              {word.partOfSpeech}
            </span>
          </div>
          <p className="font-heading font-bold text-sm text-dark mt-0.5">{word.translation}</p>
          <p className="font-body text-xs text-gray-500 mt-1 italic">&ldquo;{word.example}&rdquo;</p>
        </div>
      </div>
    </motion.button>
  );
}
