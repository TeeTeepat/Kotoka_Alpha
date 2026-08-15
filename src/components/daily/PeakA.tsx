"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";

interface PeakAProps {
  /** Today's object photo (optional — bloom still plays without it). */
  photoUrl?: string | null;
  /** Today's word, shown once, never with a score. */
  word?: string | null;
  /** Called when the beat finishes or the user taps to skip. */
  onDone: () => void;
}

const PETAL_COLORS = [
  "#ffd166",
  "#f4978e",
  "#a8dadc",
  "#bde0a6",
  "#cdb4db",
  "#ffe5a8",
];

const DURATION_MS = 4500; // hard budget: <= 5s

/**
 * Peak A — the bloom. Fires deterministically when the checkpoint step
 * (Second Take) completes: pure session state, NEVER conditioned on ASR
 * output, pronunciation score, or correctness. Celebrates effort only.
 * <= 5s, any tap skips.
 */
export default function PeakA({ photoUrl, word, onDone }: PeakAProps) {
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const t = setTimeout(finish, DURATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deterministic petal layout (no Math.random so SSR/CSR match).
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 110 + (i % 3) * 42;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 30,
          rotate: (i * 47) % 360,
          delay: 0.35 + (i % 5) * 0.08,
          color: PETAL_COLORS[i % PETAL_COLORS.length],
          size: 10 + (i % 4) * 4,
        };
      }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 42%, rgba(255,246,224,0.97) 0%, rgba(255,231,200,0.97) 55%, rgba(250,214,190,0.97) 100%)",
      }}
      onPointerDown={finish}
      role="status"
      aria-label="Well done"
    >
      {/* Expanding warm ring */}
      <motion.span
        className="absolute rounded-full border-4 border-amber-300/60"
        initial={{ width: 60, height: 60, opacity: 0.9 }}
        animate={{ width: 480, height: 480, opacity: 0 }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
      />

      {/* Petals blooming outward */}
      {petals.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          }}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, 1.15, 1],
            rotate: p.rotate,
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 2.6, delay: p.delay, ease: "easeOut" }}
        />
      ))}

      {/* Today's object, blooming up from the centre */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.15 }}
        className="relative z-10 flex flex-col items-center"
      >
        {photoUrl ? (
          <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={word ?? "today's object"}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <motion.span
            className="text-6xl"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            🌸
          </motion.span>
        )}
        {word && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-4 font-heading font-extrabold text-2xl text-dark"
          >
            {word}
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-1 font-body text-sm text-dark/60"
        >
          The world heard you.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
