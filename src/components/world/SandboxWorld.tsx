"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Camera } from "lucide-react";
import WorldTint from "./WorldTint";
import CollectibleSprite from "./CollectibleSprite";
import { hasShimmer, useShimmerTopics } from "./ShimmerOverlay";
import PeakB from "@/components/daily/PeakB";
import type { WorldCollectible, WorldPeakBPending } from "./types";
import { getTimeOfDay, type Weather } from "@/lib/compositing";
import { useLocale } from "@/lib/i18n";

/**
 * The Living Sandbox home world. Collectibles live on a free grid,
 * dim ones fade into scenery, bloomed ones show their photo on tap.
 * One curiosity bubble near the newest collectible; nothing is announced.
 */
export default function SandboxWorld() {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [weather, setWeather] = useState<Weather>("clear");
  const [collectibles, setCollectibles] = useState<WorldCollectible[]>([]);
  const [loaded, setLoaded] = useState(false);
  const shimmerTopics = useShimmerTopics();
  const [overnightPeakB, setOvernightPeakB] =
    useState<WorldPeakBPending | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/world/state")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.weather) setWeather(data.weather as Weather);
        if (Array.isArray(data.collectibles)) setCollectibles(data.collectibles);
        if (data.peakB) setOvernightPeakB(data.peakB as WorldPeakBPending);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMoved = useCallback((id: string, posX: number, posY: number) => {
    setCollectibles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, posX, posY } : c))
    );
    fetch("/api/world/position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, posX, posY }),
    }).catch(() => {});
  }, []);

  // Overnight reveal seen (finished or skipped): clear locally and
  // server-side so the settle beat plays exactly once.
  const handleOvernightSeen = useCallback(() => {
    setOvernightPeakB(null);
    fetch("/api/daily/peakb-seen", { method: "POST" }).catch(() => {});
  }, []);

  const newest = collectibles.reduce<WorldCollectible | null>(
    (best, c) =>
      !best || new Date(c.createdAt) > new Date(best.createdAt) ? c : best,
    null
  );

  const night = getTimeOfDay() === "night";

  return (
    <div className="relative -mx-4" style={{ minHeight: "calc(100vh - 8.5rem)" }}>
      <WorldTint weather={weather} />

      {/* Overnight reveal: app closed before Peak B could play yesterday */}
      <AnimatePresence>
        {overnightPeakB && (
          <PeakB
            key="overnight-peakb"
            variant="overnight"
            photoUrl={overnightPeakB.photoUrl}
            word={overnightPeakB.word}
            weather={weather}
            onDone={handleOvernightSeen}
          />
        )}
      </AnimatePresence>

      {/* World stage */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height: "calc(100vh - 8.5rem)" }}
      >
        {/* Ground */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "42%",
            background: night
              ? "linear-gradient(180deg, rgba(34,48,74,0) 0%, rgba(30,44,68,0.75) 30%, rgba(24,36,58,0.95) 100%)"
              : "linear-gradient(180deg, rgba(167,216,168,0) 0%, rgba(167,216,168,0.65) 30%, rgba(134,192,145,0.9) 100%)",
            borderRadius: "50% 50% 0 0 / 18% 18% 0 0",
          }}
        />

        {/* Soft distant hills */}
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            bottom: "34%",
            height: "18%",
            background: night ? "rgba(52,68,100,0.5)" : "rgba(178,220,196,0.5)",
            borderRadius: "100% 100% 0 0 / 100% 100% 0 0",
            transform: "scaleX(1.4)",
          }}
        />

        {/* Collectibles */}
        {collectibles.map((c) => (
          <CollectibleSprite
            key={c.id}
            collectible={c}
            containerRef={containerRef}
            onMoved={handleMoved}
            shimmer={hasShimmer(shimmerTopics, c.topic)}
          />
        ))}

        {/* Curiosity bubble near the newest collectible */}
        {newest && (
          <Link
            href="/daily"
            className="absolute z-20"
            style={{
              left: `${Math.min(78, newest.posX + 8)}%`,
              top: `${Math.max(6, newest.posY - 14)}%`,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
              transition={{
                opacity: { delay: 1.2, duration: 0.5 },
                scale: { delay: 1.2, duration: 0.5 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.7 },
              }}
              className="relative px-3 py-2 rounded-2xl bg-white/90 shadow-md border border-white/70"
            >
              <span className="text-base leading-none">✨</span>
              <span
                className="absolute -bottom-1 left-4 w-3 h-3 bg-white/90 border-b border-r border-white/70"
                style={{ transform: "rotate(45deg)" }}
              />
            </motion.div>
          </Link>
        )}

        {/* Empty world: quiet hint plus a visible way in */}
        {loaded && collectibles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute left-0 right-0 top-[26%] flex flex-col items-center gap-3 px-6 text-center"
          >
            <p
              className={`font-body text-sm ${
                night ? "text-white/60" : "text-dark/40"
              }`}
            >
              The world is waiting for its first thing.
            </p>
            <Link
              href="/daily"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white font-body font-semibold text-sm shadow-card"
            >
              <Camera className="w-4 h-4" />
              {t.journalEmptyCta}
            </Link>
          </motion.div>
        )}

        {/* Entry to today's loop — prominent, unannounced */}
        <Link
          href="/daily"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
        >
          <motion.div
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            animate={{ boxShadow: [
              "0 0 0 0 rgba(26,211,226,0.35)",
              "0 0 0 14px rgba(26,211,226,0)",
            ] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="w-16 h-16 rounded-full bg-white/95 border border-white/70 shadow-lg flex items-center justify-center"
          >
            <Camera className="w-7 h-7 text-primary" />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
