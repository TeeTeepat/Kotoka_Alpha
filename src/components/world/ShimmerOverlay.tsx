"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * Topic shimmer: a pure visual overlay for collectibles whose topic has
 * been fully promoted. Earned once, never revoked, gates nothing.
 */

/** Fold a topic string for tolerant matching (case + diacritics). */
function foldTopic(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Fetch the user's earned shimmer topics as a folded Set. Fails quiet —
 * an empty set simply means no overlays, the world renders unchanged.
 */
export function useShimmerTopics(): Set<string> {
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/grove")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.shimmers)) return;
        setTopics(
          data.shimmers
            .map((s: { topic?: string }) => s.topic)
            .filter((t: unknown): t is string => typeof t === "string")
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => new Set(topics.map(foldTopic)), [topics]);
}

/** True when a collectible's topic has an earned shimmer. */
export function hasShimmer(
  shimmerTopics: Set<string>,
  topic: string | null | undefined
): boolean {
  if (!topic) return false;
  return shimmerTopics.has(foldTopic(topic));
}

/**
 * The glow itself. Absolutely-positioned behind a sprite; parent needs
 * `relative`. Subtle breathing radial glow plus a slow drifting sparkle —
 * decorative only, pointer-events none, never announced.
 */
export function ShimmerGlow({ size = 76 }: { size?: number }) {
  const glowSize = size * 1.55;
  return (
    <div
      className="absolute pointer-events-none"
      aria-hidden="true"
      style={{
        width: glowSize,
        height: glowSize,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: -1,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,236,170,0.55) 0%, rgba(255,222,130,0.22) 45%, rgba(255,222,130,0) 72%)",
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.94, 1.05, 0.94] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4,
            height: 4,
            left: `${28 + i * 22}%`,
            top: `${20 + ((i * 37) % 45)}%`,
            background: "rgba(255,244,200,0.95)",
            boxShadow: "0 0 6px 2px rgba(255,230,150,0.7)",
          }}
          animate={{ opacity: [0, 1, 0], y: [2, -6, 2] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.05,
          }}
        />
      ))}
    </div>
  );
}
