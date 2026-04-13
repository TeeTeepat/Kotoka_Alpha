"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface CEFRQuestionCardProps {
  sentence: string;
  options: [string, string, string, string];
  correctAnswer: string;
  onAnswer: (correct: boolean) => void;
  disabled?: boolean;
  passage?: string;
}

export function CEFRQuestionCard({
  sentence,
  options,
  correctAnswer,
  onAnswer,
  disabled = false,
  passage,
}: CEFRQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (answer: string) => {
    if (disabled || showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === correctAnswer;
    onAnswer(isCorrect);

    // Auto-advance after 1 second
    setTimeout(() => {
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1000);
  };

  const parts = sentence.split("_____");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="card-base bg-white p-6 space-y-4"
    >
      {/* Reading passage */}
      {passage && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 max-h-36 overflow-y-auto">
          <p className="font-body text-xs text-gray-600 leading-relaxed whitespace-pre-line">{passage}</p>
        </div>
      )}

      {/* Question sentence */}
      <div className="text-center">
        <p className="font-body text-xl text-dark leading-relaxed">
          {parts[0]}
          <span className="inline-block min-w-[80px] border-b-2 border-primary mx-1 text-primary font-bold">
            {selectedAnswer || "____"}
          </span>
          {parts[1]}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 pt-2">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;

          return (
            <motion.button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={disabled || showResult}
              whileHover={{ scale: showResult ? 1 : 1.02 }}
              whileTap={{ scale: showResult ? 1 : 0.98 }}
              className={`
                relative overflow-hidden rounded-xl px-5 py-4 font-body text-base font-semibold
                border-2 transition-all duration-200
                ${showResult && isSelected
                  ? isCorrect
                    ? "bg-green-50 border-green-400 text-green-700"
                    : "bg-red-50 border-red-400 text-red-700"
                  : showResult && isCorrect
                    ? "bg-green-50 border-green-400 text-green-700"
                    : "bg-white border-card-border text-dark hover:border-primary/50"
                }
                ${(disabled || showResult) && "cursor-default"}
              `}
            >
              <AnimatePresence mode="wait">
                {showResult && isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {isCorrect ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                )}
                {showResult && !isSelected && isCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <span className={showResult && isSelected && !isCorrect ? "line-through opacity-60" : ""}>
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Visual feedback overlay */}
      <AnimatePresence>
        {showResult && selectedAnswer !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`
              absolute inset-0 rounded-xl pointer-events-none
              ${selectedAnswer === correctAnswer
                ? "bg-green-400/10"
                : "bg-red-400/10"
              }
            `}
            style={{ borderRadius: "1.25rem" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
