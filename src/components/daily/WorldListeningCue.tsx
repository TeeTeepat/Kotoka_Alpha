"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

/**
 * The identical "the world is listening" pre-checkpoint cue.
 * Plays for ~2 seconds before the Second Take (and always the same —
 * the sameness IS the signal), then calls onDone. Tapping skips it.
 * Purely presentational: no audio analysis, no scoring, no state.
 */
export default function WorldListeningCue({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, rgba(28,42,74,0.92) 0%, rgba(12,18,34,0.97) 100%)",
      }}
      onPointerDown={onDone}
      role="status"
      aria-label="The world is listening"
    >
      {/* Soft concentric listening ripples */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-white/30"
            initial={{ width: 48, height: 48, opacity: 0 }}
            animate={{ width: 160, height: 160, opacity: [0, 0.7, 0] }}
            transition={{
              duration: 1.8,
              delay: i * 0.45,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
        <motion.span
          className="w-12 h-12 rounded-full bg-white/90"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8 font-heading font-extrabold text-white/90 text-lg tracking-wide"
      >
        The world is listening…
      </motion.p>
    </motion.div>
  );
}
