"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ReflectionChoiceProps {
  question: string;
  options: string[];
  onSelect: (word: string) => void;
  selectedWord?: string;
}

export function ReflectionChoice({ question, options, onSelect, selectedWord }: ReflectionChoiceProps) {
  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-gray-600 italic text-center">
        {question}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {options.map((option, index) => {
          const isSelected = selectedWord === option;

          return (
            <motion.button
              key={option}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option)}
              className={`
                px-4 py-2 rounded-full font-heading font-semibold text-sm transition-all duration-200
                ${isSelected
                  ? 'bg-primary text-white shadow-btn-aqua'
                  : 'bg-white text-dark border-2 border-card-border hover:border-primary'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    ✓
                  </motion.span>
                )}
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
