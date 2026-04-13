"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Lock, Star, Target } from "lucide-react";
import type { CEFRResult } from "@/lib/mockData";

interface CEFRResultRevealProps {
  result: CEFRResult;
  onComplete?: () => void;
}

const LEVEL_COLORS = {
  A1: { bg: "bg-green-500", light: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  A2: { bg: "bg-teal-500", light: "bg-teal-100", text: "text-teal-700", border: "border-teal-300" },
  B1: { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  B2: { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  C1: { bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  C2: { bg: "bg-violet-600", light: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
};

const LEVEL_DESCRIPTIONS = {
  A1: [
    "You can understand and use familiar everyday expressions",
    "Ready to start building your vocabulary foundation",
    "Perfect for beginner lessons and basic conversations",
  ],
  A2: [
    "You can communicate in simple, routine tasks",
    "Ready for elementary grammar and more vocabulary",
    "Great for everyday conversations and simple texts",
  ],
  B1: [
    "You can handle most situations while traveling",
    "Ready for intermediate grammar and expressions",
    "Perfect for understanding main ideas of familiar topics",
  ],
  B2: [
    "You can understand complex texts and technical discussions",
    "Ready for advanced vocabulary and nuances",
    "Great for fluent communication with native speakers",
  ],
  C1: [
    "You can express ideas fluently and spontaneously",
    "Ready for professional and academic content",
    "Excellent for complex reasoning and effective language use",
  ],
  C2: [
    "You have virtually complete mastery of the language",
    "Ready for any professional, academic, or literary content",
    "Near-native fluency in all domains",
  ],
};

export function CEFRResultReveal({ result, onComplete }: CEFRResultRevealProps) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const colors = LEVEL_COLORS[result.level];
  const descriptions = LEVEL_DESCRIPTIONS[result.level];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),   // Badge scales up
      setTimeout(() => setStage(2), 800),   // Glow radiates
      setTimeout(() => setStage(3), 1300),  // Sublevel slides in
      setTimeout(() => setStage(4), 1800),  // Progress arc animates
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage === 4) {
      const timer = setTimeout(() => onComplete?.(), 500);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  const circumference = 2 * Math.PI * 54; // r=54
  const strokeDashoffset = circumference - (result.progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center gap-8 py-8">
      {/* Stage 1-2: Badge with glow */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {stage >= 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: stage >= 2 ? [1, 1.2, 1] : 1,
                opacity: 1,
              }}
              transition={{
                // spring only supports 2 keyframes; use tween for the 3-keyframe pulse
                scale: stage >= 2
                  ? { type: "tween", duration: 0.4, ease: "easeInOut" }
                  : { type: "spring", stiffness: 300, damping: 25 },
                opacity: { duration: 0.3 },
              }}
              className="relative"
            >
              {/* Glow effect */}
              <AnimatePresence>
                {stage >= 2 && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.3, 0] }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`absolute inset-0 -m-4 rounded-full ${colors.light} blur-xl`}
                  />
                )}
              </AnimatePresence>

              {/* Badge */}
              <div className={`relative w-32 h-32 ${colors.bg} rounded-full flex items-center justify-center shadow-2xl`}>
                <div className="text-center text-white">
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="font-heading font-extrabold text-5xl"
                  >
                    {result.level}
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="font-body text-sm font-semibold opacity-90"
                  >
                    Level
                  </motion.p>
                </div>

                {/* Decorative stars */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute"
                    style={{
                      top: 8,
                      [i === 1 ? "left" : i === 2 ? "right" : "left"]: "50%",
                      transform: i === 1 ? "translateX(-50%)" : i === 2 ? "translateX(50%)" : "translateX(-50%)",
                    }}
                  >
                    <Star className="w-4 h-4 text-white fill-white" />
                  </motion.div>
                ))}
              </div>

              {/* Award icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                <Award className={`w-6 h-6 ${colors.text}`} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stage 3: Sublevel */}
      <AnimatePresence>
        {stage >= 3 && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="text-center"
          >
            <p className="font-body text-dark text-lg">
              Sublevel <span className="font-heading font-extrabold text-2xl text-primary">{result.sublevel}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 4: Progress arc */}
      <AnimatePresence>
        {stage >= 4 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-36 h-36"
          >
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <motion.circle
                cx="72"
                cy="72"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className={colors.text}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                  className="font-heading font-extrabold text-3xl text-dark"
                >
                  {Math.round(result.progress)}%
                </motion.p>
                <p className="font-body text-xs text-gray-500">Progress</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* What this means */}
      <AnimatePresence>
        {stage >= 4 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-full max-w-xs"
          >
            <div className="card-base bg-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg text-dark">What this means</h3>
              </div>
              <ul className="space-y-2">
                {descriptions.map((desc: string, i: number) => (
                  <motion.li
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                    className="flex items-start gap-2"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.bg} mt-2 flex-shrink-0`} />
                    <p className="font-body text-sm text-gray-600">{desc}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
