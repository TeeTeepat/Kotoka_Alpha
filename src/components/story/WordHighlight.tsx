"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface WordHighlightProps {
  word: string;
  definition: string;
}

export function WordHighlight({ word, definition }: WordHighlightProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span className="relative inline-block">
      <motion.span
        className="inline-block cursor-pointer px-1.5 py-0.5 rounded-full"
        style={{
          background: "linear-gradient(90deg, #e0f7fa 0%, #b2ebf2 50%, #e0f7fa 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s ease infinite",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setIsHovered(!isHovered)}
      >
        <span className="font-body font-semibold text-primary-dark">
          {word}
        </span>
      </motion.span>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 rounded-xl bg-dark/95 backdrop-blur-sm shadow-lg"
          >
            <p className="font-body text-xs text-white leading-relaxed">
              {definition}
            </p>
            <div className="absolute w-2 h-2 bg-dark/95 rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </span>
  );
}
