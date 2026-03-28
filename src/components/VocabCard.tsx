"use client";

import { motion } from "framer-motion";
import { Volume2, BookOpen } from "lucide-react";
import type { VocabWord } from "@/types";
import { cn } from "@/lib/utils";

interface VocabCardProps {
  word: VocabWord;
  index: number;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function VocabCard({ word, index }: VocabCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-card border-[1.5px] border-card-border shadow-card p-4 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-extrabold text-dark text-lg">
            {word.word}
          </h3>
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="text-primary hover:text-primary-dark transition-colors"
            aria-label="Pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </motion.button>
        </div>
        <span
          className={cn(
            "text-[10px] font-body font-medium px-2 py-0.5 rounded-full",
            difficultyColors[word.difficulty] || difficultyColors.intermediate
          )}
        >
          {word.difficulty}
        </span>
      </div>

      <p className="text-xs font-body text-gray-400 mb-2">{word.phonetic}</p>

      <p className="text-sm font-body font-medium text-accent-plum mb-2">
        {word.translation}
      </p>

      <div className="flex items-start gap-2 bg-background rounded-xl p-3">
        <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs font-body text-dark leading-relaxed">
          {word.example}
        </p>
      </div>
    </motion.div>
  );
}
