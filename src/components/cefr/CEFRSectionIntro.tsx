"use client";

import { motion } from "framer-motion";

interface CEFRSectionIntroProps {
  icon: string;
  title: string;
  description: string;
  questionCount: number;
  onStart: () => void;
  sectionIndex: number;
  totalSections: number;
}

export function CEFRSectionIntro({
  icon,
  title,
  description,
  questionCount,
  onStart,
  sectionIndex,
  totalSections,
}: CEFRSectionIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="card-base bg-white p-8 text-center space-y-6 w-full max-w-sm mx-auto"
    >
      <div className="text-6xl">{icon}</div>
      <div className="space-y-2">
        <p className="font-body text-xs text-gray-400 uppercase tracking-widest">
          Section {sectionIndex + 1} of {totalSections}
        </p>
        <h2 className="font-heading font-extrabold text-2xl text-dark">{title}</h2>
        <p className="font-body text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
      <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
        <span className="text-primary font-body font-bold text-sm">
          {questionCount} {questionCount === 1 ? "question" : "questions"}
        </span>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="btn-aqua w-full py-4 text-base"
      >
        Start {title} →
      </motion.button>
    </motion.div>
  );
}
