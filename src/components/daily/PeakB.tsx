"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  getTimeOfDay,
  getWorldTint,
  type Weather,
} from "@/lib/compositing";

interface PeakBProps {
  /** Today's snapped photo — the object that settles into the world. */
  photoUrl?: string | null;
  /** Today's word (shown quietly under the settling object). */
  word?: string | null;
  /** Current weather so the tint is baked into the beat. */
  weather?: Weather;
  /**
   * "done" — played right after the "done for today" tap.
   * "overnight" — the reveal on next launch when the app was closed
   * before the settle could play (User.peakBPendingAt was set).
   */
  variant?: "done" | "overnight";
  /** Called when the beat finishes or the user taps to skip. */
  onDone: () => void;
}

const DURATION_MS = 4500; // hard budget: <= 5s

/**
 * Peak B — the settle. Today's object drifts down and takes its place in
 * the world, with today's photo and the current time-of-day/weather tint
 * baked in. Triggered by "done for today"; if the app closed first, the
 * same beat plays as an overnight reveal on next launch. <= 5s, tap skips.
 * No score, no numbers — just the world quietly gaining a thing.
 */
export default function PeakB({
  photoUrl,
  word,
  weather = "clear",
  variant = "done",
  onDone,
}: PeakBProps) {
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

  // Bake the current tint once — this is "today's light" for the memory.
  const tint = useMemo(() => getWorldTint(getTimeOfDay(), weather), [weather]);
  const night = tint.darkGround;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-end overflow-hidden"
      style={{ background: tint.background }}
      onPointerDown={finish}
      role="status"
      aria-label={
        variant === "overnight"
          ? "While you were away, it found its place"
          : "Settling into the world"
      }
    >
      {tint.weatherWash && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: tint.weatherWash }}
        />
      )}

      {/* Ground the object settles onto */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "38%",
          background: night
            ? "linear-gradient(180deg, rgba(34,48,74,0) 0%, rgba(30,44,68,0.75) 30%, rgba(24,36,58,0.95) 100%)"
            : "linear-gradient(180deg, rgba(167,216,168,0) 0%, rgba(167,216,168,0.65) 30%, rgba(134,192,145,0.9) 100%)",
          borderRadius: "50% 50% 0 0 / 18% 18% 0 0",
        }}
      />

      {/* The object drifting down to its place */}
      <motion.div
        initial={{ y: "-52vh", scale: 0.86, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{
          y: { duration: 2.4, ease: [0.22, 0.9, 0.32, 1], delay: 0.3 },
          scale: { duration: 2.4, ease: "easeOut", delay: 0.3 },
          opacity: { duration: 0.6, delay: 0.3 },
        }}
        className="relative z-10 mb-[26vh] flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: [0, -2.5, 2, 0] }}
          transition={{ duration: 2.4, delay: 0.3, ease: "easeInOut" }}
          className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/85 bg-white/60"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={word ?? "today's object"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🌱
            </div>
          )}
        </motion.div>

        {/* Landing dust puff */}
        <motion.span
          className="absolute -bottom-2 rounded-[50%]"
          style={{
            width: 96,
            height: 14,
            background: night
              ? "rgba(255,255,255,0.18)"
              : "rgba(255,255,255,0.55)",
          }}
          initial={{ scaleX: 0.2, opacity: 0 }}
          animate={{ scaleX: [0.2, 1.25, 1], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.9, delay: 2.6, ease: "easeOut" }}
        />
      </motion.div>

      {/* Quiet caption */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.9, duration: 0.6 }}
        className="absolute bottom-[12vh] left-0 right-0 text-center px-8"
      >
        {word && (
          <p
            className={`font-heading font-extrabold text-xl ${
              night ? "text-white/90" : "text-dark"
            }`}
          >
            {word}
          </p>
        )}
        <p
          className={`mt-1 font-body text-sm ${
            night ? "text-white/60" : "text-dark/50"
          }`}
        >
          {variant === "overnight"
            ? "While you were away, it found its place."
            : "It lives here now."}
        </p>
      </motion.div>
    </motion.div>
  );
}
