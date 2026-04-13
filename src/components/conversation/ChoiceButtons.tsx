"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ChoiceButtonsProps {
  choices: string[];
  correctIndex?: number;
  onSelect: (choice: string, isCorrect?: boolean) => void;
  onFallback?: () => void;
  disabled?: boolean;
}

export default function ChoiceButtons({ choices, correctIndex, onSelect, onFallback, disabled }: ChoiceButtonsProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (choice: string, idx: number) => {
    if (selected !== null || disabled) return;
    const isCorrect = correctIndex !== undefined ? idx === correctIndex : undefined;
    setSelected(idx);
    setTimeout(() => onSelect(choice, isCorrect), 500);
  };

  return (
    <div className="space-y-2">
      {choices.map((choice, index) => {
        const isSelected = selected === index;
        const showCorrect = isSelected && correctIndex !== undefined && index === correctIndex;
        const showWrong = isSelected && correctIndex !== undefined && index !== correctIndex;

        return (
          <motion.button
            key={choice}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={selected === null && !disabled ? { scale: 1.02, y: -1 } : {}}
            whileTap={selected === null && !disabled ? { scale: 0.97 } : {}}
            onClick={() => handleClick(choice, index)}
            disabled={disabled || (selected !== null && !isSelected)}
            className={`w-full text-left px-4 py-3 rounded-2xl border-2 font-body text-sm transition-colors ${
              showCorrect
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : showWrong
                ? "border-red-400 bg-red-50 text-red-700"
                : selected !== null && !isSelected
                ? "border-card-border bg-white text-gray-300 opacity-50"
                : "border-card-border bg-white text-dark hover:border-primary hover:bg-primary/5"
            }`}
          >
            {choice}
          </motion.button>
        );
      })}
      {onFallback && selected === null && (
        <button
          onClick={onFallback}
          className="font-body text-xs text-gray-400 hover:text-gray-600 mt-2 w-full text-center"
        >
          Type instead
        </button>
      )}
    </div>
  );
}
