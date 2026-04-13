"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

const LEVEL_COLORS = {
  A1: { bg: "bg-green-500", light: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  A2: { bg: "bg-teal-500", light: "bg-teal-100", text: "text-teal-700", border: "border-teal-300" },
  B1: { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  B2: { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  C1: { bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
};

interface StoredCEFR {
  level: string;
  sublevel: number;
  progress: number;
  testComplete: boolean;
}

interface CEFRProfileWidgetProps {
  className?: string;
}

export function CEFRProfileWidget({ className = "" }: CEFRProfileWidgetProps) {
  const [cefrData, setCefrData] = useState<StoredCEFR | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("kotoka_cefr_level");
    if (stored) {
      setCefrData({
        level: stored,
        sublevel: parseInt(localStorage.getItem("kotoka_cefr_sublevel") || "1"),
        progress: parseFloat(localStorage.getItem("kotoka_cefr_progress") || "0"),
        testComplete: localStorage.getItem("kotoka_cefr_test_complete") === "true",
      });
    }
  }, []);

  if (!cefrData || !cefrData.testComplete) {
    return null;
  }

  const colors = LEVEL_COLORS[cefrData.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.A1;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-3 px-4 py-2.5 bg-white rounded-full border-2 ${colors.border} shadow-sm ${className}`}
    >
      {/* Level Badge */}
      <div className={`flex items-center justify-center w-10 h-10 ${colors.bg} rounded-full`}>
        <span className="font-heading font-extrabold text-white text-lg">
          {cefrData.level}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 min-w-[100px]">
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-xs font-semibold text-gray-600">
            Level {cefrData.level}.{cefrData.sublevel}
          </span>
          <span className="font-body text-xs text-gray-500">{Math.round(cefrData.progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${cefrData.progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full ${colors.bg} rounded-full`}
          />
        </div>
      </div>

      {/* Award Icon */}
      <Award className={`w-5 h-5 ${colors.text}`} />
    </motion.div>
  );
}
