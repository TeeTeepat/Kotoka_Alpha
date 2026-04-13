"use client";

import { motion } from "framer-motion";

interface WordChipProps {
  word: string;
  detected: boolean;
}

export default function WordChip({ word, detected }: WordChipProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        scale: detected ? [1, 1.1, 1] : 1,
        backgroundColor: detected ? "#10b981" : "transparent",
      }}
      transition={{
        scale: { duration: 0.3, ease: "easeInOut" },
        backgroundColor: { duration: 0.2 },
      }}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full border font-body text-sm font-medium transition-colors ${
        detected
          ? "bg-emerald-500 border-emerald-500 text-white"
          : "border-gray-200 text-gray-600 bg-white"
      }`}
    >
      {word}
    </motion.div>
  );
}
