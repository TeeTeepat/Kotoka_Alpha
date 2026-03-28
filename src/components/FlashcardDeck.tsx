"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn, loadStats, saveStats } from "@/lib/utils";
import type { WordData } from "@/types";

interface FlashcardDeckProps {
  words: WordData[];
  sceneDesc: string;
  onComplete?: () => void;
}

export default function FlashcardDeck({ words, sceneDesc, onComplete }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentWord = words[currentIndex];
  const progress = mastered.size / words.length;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleGotIt = useCallback(() => {
    const newMastered = new Set(mastered);
    newMastered.add(currentIndex);
    setMastered(newMastered);

    if (newMastered.size === words.length) {
      const stats = loadStats();
      stats.coins += 5;
      stats.wordsLearned += words.length;
      saveStats(stats);
      window.dispatchEvent(new Event("kotoka-stats-update"));
      setCompleted(true);
      onComplete?.();
      return;
    }

    goNext();
  }, [currentIndex, mastered, words.length, onComplete]);

  const handleReviewAgain = useCallback(() => {
    goNext();
  }, []);

  const goNext = () => {
    setIsFlipped(false);
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const goPrev = () => {
    setIsFlipped(false);
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-16 h-16 text-gold mb-4" />
        </motion.div>
        <h2 className="font-heading font-extrabold text-2xl text-dark mb-2">
          Deck Complete!
        </h2>
        <p className="font-body text-sm text-gray-500 mb-2">
          You mastered all {words.length} words
        </p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-1 text-gold font-heading font-extrabold text-lg"
        >
          +5 KotoCoins earned!
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-xs font-body text-gray-400 text-center">
        {mastered.size} / {words.length} mastered
      </p>

      {/* Card */}
      <div className="relative h-[300px] perspective-1000">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex + (isFlipped ? "-back" : "-front")}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100, rotateY: isFlipped ? 180 : 0 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={handleFlip}
            className={cn(
              "absolute inset-0 bg-white rounded-card border-[1.5px] border-card-border shadow-card p-6 cursor-pointer flex flex-col items-center justify-center text-center",
              mastered.has(currentIndex) && "border-green-200 bg-green-50/30"
            )}
          >
            {!isFlipped ? (
              <>
                <p className="text-xs font-body text-gray-400 mb-4">
                  {sceneDesc}
                </p>
                <h2 className="font-heading font-extrabold text-3xl text-dark mb-2">
                  {currentWord.word}
                </h2>
                <p className="text-sm font-body text-gray-400">
                  {currentWord.phonetic}
                </p>
                <p className="text-xs font-body text-primary mt-6">
                  Tap to reveal
                </p>
              </>
            ) : (
              <>
                <p className="font-heading font-extrabold text-xl text-accent-plum mb-3">
                  {currentWord.translation}
                </p>
                <div className="bg-background rounded-xl p-3 w-full">
                  <p className="text-sm font-body text-dark leading-relaxed">
                    &ldquo;{currentWord.example}&rdquo;
                  </p>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewAgain();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] border-orange/30 text-orange text-xs font-body font-medium hover:bg-orange/5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Review again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGotIt();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-body font-medium shadow-btn-aqua"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Got it!
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          className="p-2 rounded-full bg-white border border-card-border shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-dark" />
        </motion.button>
        <span className="text-sm font-body font-medium text-dark">
          {currentIndex + 1} / {words.length}
        </span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goNext}
          className="p-2 rounded-full bg-white border border-card-border shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-dark" />
        </motion.button>
      </div>
    </div>
  );
}
