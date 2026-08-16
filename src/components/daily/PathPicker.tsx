"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  GATE_COPY,
  GATE_STEPS,
  orderFlexibleSteps,
  type AgeBand,
  type FlexibleStepId,
  type GateId,
} from "./gates";

interface PathPickerProps {
  ageBand: AgeBand;
  /** Today's word id, journalled alongside the gate choice when known. */
  wordId?: string | null;
  /** The engine's current flexible-step queue (pending steps only). */
  flexibleQueue: readonly FlexibleStepId[];
  /**
   * Called with the chosen gate and the reordered queue. The engine should
   * replace its flexible-step queue with `orderedSteps` and advance.
   */
  onChosen: (gate: GateId, orderedSteps: FlexibleStepId[]) => void;
  /** "Wander on" — no gate, keep the queue as-is. Always available. */
  onSkip: () => void;
}

/** Visual treatment per gate: in-world arch portals, not menu buttons. */
const GATE_STYLE: Record<
  GateId,
  { arch: string; glow: string; ground: string; glyph: string }
> = {
  sound: {
    arch: "from-primary/80 to-primary-dark/90",
    glow: "shadow-[0_0_28px_rgba(26,211,226,0.45)]",
    ground: "bg-primary/20",
    glyph: "♪", // ♪
  },
  word: {
    arch: "from-gold/80 to-orange/90",
    glow: "shadow-[0_0_28px_rgba(245,200,66,0.45)]",
    ground: "bg-gold/20",
    glyph: "✎", // ✎
  },
  quiet: {
    arch: "from-accent-lavender to-accent-plum/90",
    glow: "shadow-[0_0_28px_rgba(152,115,155,0.45)]",
    ground: "bg-accent-lavender/40",
    glyph: "☾", // ☾
  },
};

const GATE_ORDER: GateId[] = ["sound", "word", "quiet"];

/**
 * Path Picker — three in-world gates shown right after Confirm.
 * Choosing one journals the choice (fire-and-forget) and hands the engine a
 * reordered flexible-step queue. It is a starting route only: the child can
 * always "wander on" past the gates, and nothing here gates the checkpoint.
 */
export default function PathPicker({
  ageBand,
  wordId,
  flexibleQueue,
  onChosen,
  onSkip,
}: PathPickerProps) {
  const [chosen, setChosen] = useState<GateId | null>(null);
  const copy = GATE_COPY[ageBand];
  const young = ageBand === "7-10";

  const choose = (gate: GateId) => {
    if (chosen) return;
    setChosen(gate);

    // Journal the choice without blocking the flow — the loop never waits
    // on the network, and a failed journal write never costs the child.
    fetch("/api/daily/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gate, wordId: wordId ?? null, ageBand }),
    }).catch(() => {});

    // Small beat so the gate visibly "opens" before the engine advances.
    const ordered = orderFlexibleSteps(gate, flexibleQueue);
    setTimeout(() => onChosen(gate, ordered), 650);
  };

  return (
    <div className="flex flex-col items-center w-full px-4 py-6">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-heading font-extrabold text-lg text-dark mb-1 text-center"
      >
        {young ? "Three paths open up…" : "Pick a path"}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="font-body text-sm text-gray-400 mb-6 text-center"
      >
        {young ? "Which one calls to you?" : "Or wander wherever you like."}
      </motion.p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {GATE_ORDER.map((gate, i) => {
          const style = GATE_STYLE[gate];
          const c = copy[gate];
          const isChosen = chosen === gate;
          const isDimmed = chosen !== null && !isChosen;

          return (
            <motion.button
              key={gate}
              type="button"
              aria-label={`${c.name}. ${c.leadsTo}.`}
              disabled={chosen !== null}
              onClick={() => choose(gate)}
              initial={{ opacity: 0, y: 24 }}
              animate={{
                opacity: isDimmed ? 0.35 : 1,
                y: 0,
                scale: isChosen ? 1.06 : 1,
              }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.35 }}
              whileHover={chosen ? undefined : { y: -4 }}
              whileTap={chosen ? undefined : { scale: 0.96 }}
              className="flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            >
              {/* Arch portal */}
              <div
                className={`relative w-full aspect-[3/4] rounded-t-full bg-gradient-to-b ${style.arch} ${
                  isChosen ? style.glow : "shadow-card"
                } overflow-hidden transition-shadow duration-300`}
              >
                {/* Inner doorway */}
                <motion.div
                  animate={isChosen ? { opacity: 1, scale: 1.15 } : { opacity: 0.85, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-x-[14%] bottom-0 top-[18%] rounded-t-full bg-white/25 backdrop-blur-[1px]"
                />
                <motion.span
                  aria-hidden
                  animate={
                    isChosen
                      ? { scale: 1.4, opacity: 0 }
                      : { y: [0, -3, 0], opacity: 1 }
                  }
                  transition={
                    isChosen
                      ? { duration: 0.5 }
                      : { duration: 3 + i, repeat: Infinity, ease: "easeInOut" }
                  }
                  className="absolute inset-0 flex items-center justify-center text-3xl text-white drop-shadow"
                >
                  {style.glyph}
                </motion.span>
              </div>
              {/* Grounding pad so gates sit "in the world" */}
              <div className={`w-4/5 h-2 -mt-1 rounded-[50%] ${style.ground}`} />

              <p className="font-heading font-extrabold text-xs text-dark mt-2 text-center leading-tight">
                {c.name}
              </p>
              <p className="font-body text-[10px] text-gray-400 mt-0.5 text-center leading-tight">
                {c.tagline}
              </p>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        type="button"
        onClick={onSkip}
        disabled={chosen !== null}
        initial={{ opacity: 0 }}
        animate={{ opacity: chosen ? 0.3 : 1 }}
        transition={{ delay: 0.6 }}
        className="mt-7 font-body text-sm text-gray-400 underline underline-offset-4 decoration-dotted hover:text-dark transition-colors"
      >
        {young ? "wander on…" : "wander on"}
      </motion.button>
    </div>
  );
}

export { GATE_STEPS, orderFlexibleSteps };
export type { GateId, FlexibleStepId, AgeBand };
