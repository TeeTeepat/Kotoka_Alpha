"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AnswerFeedbackProps {
  isCorrect: boolean | null;
  correctAnswer: string;
  visible: boolean;
}

export function AnswerFeedback({ isCorrect, correctAnswer, visible }: AnswerFeedbackProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {show && isCorrect !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={
            isCorrect
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 1, scale: 1, y: 0, x: [-10, 10, -10, 10, 0] }
          }
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 25 },
            opacity: { duration: 0.2 },
            x: { duration: 0.4, times: [0, 0.25, 0.5, 0.75, 1] },
          }}
          className="flex flex-col items-center gap-2 py-3"
        >
          <motion.div
            animate={
              isCorrect
                ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                : { scale: [1, 1.1, 1] }
            }
            transition={{ duration: 0.4 }}
          >
            {isCorrect ? (
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <X className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            )}
          </motion.div>
          {!isCorrect && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-body text-sm text-gray-600 text-center"
            >
              The answer was: <span className="font-heading font-bold text-dark">{correctAnswer}</span>
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
