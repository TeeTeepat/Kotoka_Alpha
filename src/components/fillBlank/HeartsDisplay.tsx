"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface HeartsDisplayProps {
  hearts: number;
  onLost?: () => void;
}

export function HeartsDisplay({ hearts, onLost }: HeartsDisplayProps) {
  const maxHearts = 5;

  return (
    <div className="flex items-center gap-1.5">
      {[...Array(maxHearts)].map((_, index) => {
        const isFull = index < hearts;
        const wasLost = index === hearts - 1 && hearts < maxHearts;

        return (
          <AnimatePresence key={index} mode="wait">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: wasLost ? [1, 1.1, 0.8, 1] : 1,
                rotate: 0,
                x: wasLost ? [0, -4, 4, -4, 4, 0] : 0,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={
                wasLost
                  ? {
                      x: { duration: 0.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                      scale: { duration: 0.5 },
                    }
                  : { type: "spring", stiffness: 300, damping: 25 }
              }
              onAnimationComplete={() => {
                if (wasLost && index === maxHearts - 1) {
                  onLost?.();
                }
              }}
            >
              <Heart
                className={`w-5 h-5 transition-colors duration-300 ${
                  isFull ? "fill-red-500 text-red-500" : "text-gray-300"
                }`}
              />
            </motion.div>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
