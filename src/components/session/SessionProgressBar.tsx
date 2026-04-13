"use client";

import { motion } from "framer-motion";
import type { SkillType } from "@/types";

interface SessionProgressBarProps {
  questionsDone: number;
  questionsTotal: number;
  currentSkill: SkillType;
}

const SKILL_LABELS: Record<SkillType, string> = {
  flashcards: "Flash",
  conversation: "Chat",
  dictation: "Listen",
  pronunciation: "Speak",
  "fill-blank": "Fill",
};

const SKILL_COLORS: Record<SkillType, string> = {
  flashcards: "#1ad3e2",
  conversation: "#8b5cf6",
  dictation: "#10b981",
  pronunciation: "#f59e0b",
  "fill-blank": "#ec4899",
};

const SKILL_EMOJI: Record<SkillType, string> = {
  flashcards: "🃏",
  conversation: "💬",
  dictation: "🎧",
  pronunciation: "🔊",
  "fill-blank": "✏️",
};

export default function SessionProgressBar({
  questionsDone,
  questionsTotal,
  currentSkill,
}: SessionProgressBarProps) {
  const progress = questionsTotal > 0 ? Math.round((questionsDone / questionsTotal) * 100) : 0;
  const color = SKILL_COLORS[currentSkill];

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Current skill + count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{SKILL_EMOJI[currentSkill]}</span>
          <span
            className="font-heading font-bold text-xs"
            style={{ color }}
          >
            {SKILL_LABELS[currentSkill]}
          </span>
        </div>
        <span className="font-body text-xs text-gray-400">
          {questionsDone} / {questionsTotal}
        </span>
      </div>
    </div>
  );
}
