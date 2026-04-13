"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ConversationScenario } from "@/lib/mockData";

interface ScenarioCardProps {
  scenario: ConversationScenario;
  index: number;
  onStart: () => void;
}

export default function ScenarioCard({ scenario, index, onStart }: ScenarioCardProps) {
  const gradientColors: Record<string, string> = {
    "client-meeting": "from-blue-50 to-indigo-50 border-blue-200",
    "cafe-small-talk": "from-amber-50 to-orange-50 border-amber-200",
    "airport-travel": "from-cyan-50 to-teal-50 border-cyan-200",
  };

  const gradient = gradientColors[scenario.id] || "from-gray-50 to-slate-50 border-gray-200";

  const previewWords = scenario.targetWords.slice(0, 3);
  const remainingCount = Math.max(0, scenario.targetWords.length - 3);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onStart}
      className={`card-base p-5 text-left bg-gradient-to-br ${gradient} border hover:shadow-card-hover transition-all w-full`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{scenario.emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-extrabold text-lg text-dark">{scenario.title}</h3>
          <p className="font-body text-sm text-gray-500 mt-1">{scenario.description}</p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {previewWords.map((word) => (
              <span
                key={word}
                className="text-[10px] font-body font-medium bg-white/70 text-dark px-2 py-1 rounded-full border border-white/50"
              >
                {word}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-[10px] font-body font-medium text-gray-400">
                +{remainingCount} more
              </span>
            )}
            <span className="ml-auto text-[10px] font-heading font-extrabold bg-primary/10 text-primary px-2 py-1 rounded-full">
              {scenario.targetWords.length} words
            </span>
          </div>

          <div className="flex items-center gap-2 mt-4 text-primary font-heading font-extrabold text-sm">
            Start
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
