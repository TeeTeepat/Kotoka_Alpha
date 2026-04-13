"use client";

import { motion } from "framer-motion";
import { Coins, Flame, Target } from "lucide-react";

interface SectionCompleteModalProps {
  accuracy: number;
  timeSpent: number;
  wordsReviewed: number;
  coinsEarned: number;
  streak: number;
  onContinue: () => void;
}

export default function SectionCompleteModal({
  accuracy,
  timeSpent,
  wordsReviewed,
  coinsEarned,
  streak,
  onContinue,
}: SectionCompleteModalProps) {
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="card-base p-8 mx-6 max-w-sm w-full text-center space-y-5"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl"
        >
          {accuracy >= 0.9 ? "🎉" : accuracy >= 0.7 ? "👏" : "💪"}
        </motion.div>

        <div>
          <h2 className="font-heading font-extrabold text-xl text-dark">Session Complete!</h2>
          <p className="font-body text-sm text-gray-400 mt-1">Great work on your review!</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-heading font-extrabold text-lg text-dark">{Math.round(accuracy * 100)}%</span>
            <span className="font-body text-[10px] text-gray-400">Accuracy</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Coins className="w-5 h-5 text-gold" />
            <span className="font-heading font-extrabold text-lg text-gold">+{coinsEarned}</span>
            <span className="font-body text-[10px] text-gray-400">Coins</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Flame className="w-5 h-5 text-orange" />
            <span className="font-heading font-extrabold text-lg text-dark">{streak}</span>
            <span className="font-body text-[10px] text-gray-400">Streak</span>
          </div>
        </div>

        <div className="text-xs font-body text-gray-400">
          {wordsReviewed} words reviewed in {minutes}:{seconds.toString().padStart(2, "0")}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="btn-aqua w-full py-3.5"
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
