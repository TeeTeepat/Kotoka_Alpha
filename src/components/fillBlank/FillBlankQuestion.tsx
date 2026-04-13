"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { ParticleEffect } from "@/components/ParticleEffect";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import type { FillBlankQuestion as FillBlankQuestionType } from "@/lib/mockData";

interface FillBlankQuestionProps {
  question: FillBlankQuestionType;
  mode: "beginner" | "advanced";
  onAnswer: (correct: boolean) => void;
  disabled?: boolean;
}

export function FillBlankQuestion({ question, mode, onAnswer, disabled }: FillBlankQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [hintTriggered, setHintTriggered] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const { play } = useSoundPlayer();

  const parts = question.sentenceWithBlank.split("______");

  const handleSubmit = () => {
    if (!selectedAnswer.trim() || showResult || disabled) return;

    const isCorrect = selectedAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase();
    setShowResult(true);

    if (isCorrect) {
      play("correct");
    } else {
      play("wrong");
    }

    onAnswer(isCorrect);

    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer("");
      setHintUsed(false);
    }, 1500);
  };

  const handleHint = () => {
    if (hintUsed || showResult || disabled) return;
    setHintUsed(true);
    setHintTriggered(true);
    play("coin");

    setTimeout(() => setHintTriggered(false), 500);
  };

  const getHintText = () => {
    if (mode === "beginner") {
      return question.hint || question.correctAnswer[0] + "_";
    }
    return (
      question.correctAnswer[0] +
      "_".repeat(Math.max(0, question.correctAnswer.length - 2)) +
      (question.correctAnswer[question.correctAnswer.length - 1] || "")
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base bg-white p-6 space-y-5 relative"
    >
      <ParticleEffect type="sparkles" trigger={hintTriggered} position="top" />

      {/* Sentence with blank */}
      <div className="text-center py-4">
        <p className="font-body text-xl text-dark leading-relaxed">
          {parts[0]}
          <motion.span
            animate={
              showResult
                ? {
                    backgroundColor: selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase()
                      ? ["#d1fae5", "#a7f3d0"]
                      : ["#fee2e2", "#fecaca"],
                    scale: [1, 1.05, 1],
                  }
                : {}
            }
            transition={{ duration: 0.3 }}
            className="inline-block min-w-[100px] mx-1 px-3 py-1 border-b-4 border-primary bg-background text-primary font-heading font-bold text-lg rounded"
          >
            {selectedAnswer || "______"}
          </motion.span>
          {parts[1]}
        </p>
      </div>

      {/* Beginner Mode: MCQ Buttons */}
      {mode === "beginner" && (
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, index) => {
            const letter = ["A", "B", "C", "D"][index];
            const isSelected = selectedAnswer === option;
            const isCorrect = option === question.correctAnswer;

            return (
              <motion.button
                key={index}
                onClick={() => {
                  if (!showResult && !disabled) {
                    setSelectedAnswer(option);
                  }
                }}
                disabled={showResult || disabled}
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
                      : isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white border-card-border text-dark hover:border-primary/50"
                  }
                  ${(showResult || disabled) && "cursor-default"}
                `}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`
                    w-7 h-7 rounded-full flex items-center justify-center font-heading font-bold text-sm flex-shrink-0
                    ${isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}
                  `}
                  >
                    {letter}
                  </span>
                  <span
                    className={showResult && isSelected && !isCorrect ? "line-through opacity-60" : ""}
                  >
                    {option}
                  </span>
                </span>

                <AnimatePresence>
                  {showResult && (isSelected || isCorrect) && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCorrect ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Advanced Mode: Text Input */}
      {mode === "advanced" && (
        <div className="space-y-3">
          <input
            type="text"
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={showResult || disabled}
            placeholder="Type your answer..."
            className={`
              w-full px-5 py-4 rounded-xl font-body text-lg font-semibold border-2
              focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all
              ${
                showResult
                  ? selectedAnswer.toLowerCase() === question.correctAnswer.toLowerCase()
                    ? "bg-green-50 border-green-400 text-green-700"
                    : "bg-red-50 border-red-400 text-red-700"
                  : "bg-white border-card-border text-dark focus:border-primary"
              }
              ${(showResult || disabled) && "cursor-default"}
            `}
            autoFocus
          />
          {hintUsed && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-body text-sm text-gold text-center bg-yellow-50 py-2 px-4 rounded-lg"
            >
              Hint: <span className="font-heading font-bold">{getHintText()}</span>
            </motion.p>
          )}
        </div>
      )}

      {/* Hint Button */}
      <motion.button
        onClick={handleHint}
        disabled={hintUsed || showResult || disabled}
        whileHover={{ scale: hintUsed || showResult || disabled ? 1 : 1.05 }}
        whileTap={{ scale: hintUsed || showResult || disabled ? 1 : 0.95 }}
        onMouseEnter={() => {
          if (!hintUsed && !showResult && !disabled) {
            setHintTriggered(true);
            setTimeout(() => setHintTriggered(false), 300);
          }
        }}
        className={`
          flex items-center justify-center gap-2 py-3 px-4 rounded-xl
          font-heading font-bold text-sm transition-all
          ${
            hintUsed || showResult || disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-yellow-50 text-gold hover:bg-yellow-100"
          }
        `}
      >
        <Sparkles className="w-4 h-4" />
        {hintUsed ? "Hint Used" : "Use Hint"}
      </motion.button>

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!selectedAnswer.trim() || showResult || disabled}
        whileHover={
          !selectedAnswer.trim() || showResult || disabled
            ? {}
            : { scale: 1.02, y: -2 }
        }
        whileTap={
          !selectedAnswer.trim() || showResult || disabled ? {} : { scale: 0.98 }
        }
        className={`
          w-full py-4 rounded-2xl font-heading font-extrabold text-base
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${
            !selectedAnswer.trim() || showResult || disabled
              ? "bg-gray-200 text-gray-400"
              : "btn-aqua"
          }
        `}
      >
        {showResult ? "Submitted" : "Submit Answer"}
      </motion.button>
    </motion.div>
  );
}
