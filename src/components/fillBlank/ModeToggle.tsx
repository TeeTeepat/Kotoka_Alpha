"use client";

import { motion } from "framer-motion";

type Mode = "beginner" | "advanced";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="relative bg-gray-100 rounded-full p-1 flex items-center">
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm"
        initial={false}
        animate={{
          left: mode === "beginner" ? 4 : "calc(50% - 0px)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <button
        onClick={() => onChange("beginner")}
        className={`relative flex-1 py-2 px-4 rounded-full font-heading font-bold text-xs transition-colors ${
          mode === "beginner" ? "text-dark" : "text-gray-500"
        }`}
      >
        Multiple Choice
      </button>
      <button
        onClick={() => onChange("advanced")}
        className={`relative flex-1 py-2 px-4 rounded-full font-heading font-bold text-xs transition-colors ${
          mode === "advanced" ? "text-dark" : "text-gray-500"
        }`}
      >
        Type Answer
      </button>
    </div>
  );
}
