"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trees } from "lucide-react";
import GroveCard from "@/components/grove/GroveCard";
import GroveReplayModal from "@/components/grove/GroveReplayModal";
import { hasShimmer, useShimmerTopics } from "@/components/world/ShimmerOverlay";
import type { GroveResponse, GroveWord } from "@/components/grove/types";

/**
 * The Grove: every promoted word, individually replayable anytime.
 * Outside the session loop. Gates nothing, counts nothing, shows no
 * percentages — a quiet shelf of things the learner has kept.
 */
export default function GrovePage() {
  const [words, setWords] = useState<GroveWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWord, setOpenWord] = useState<GroveWord | null>(null);
  const shimmerTopics = useShimmerTopics();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/grove")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: GroveResponse | null) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.words)) setWords(data.words);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-5 pb-4">
        <Link
          href="/"
          aria-label="Back to the world"
          className="w-9 h-9 rounded-xl bg-white border border-card-border shadow-card flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-dark" />
        </Link>
        <div className="flex items-center gap-2">
          <Trees className="w-5 h-5 text-primary" />
          <h1 className="font-heading font-extrabold text-lg text-dark">
            The Grove
          </h1>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-card-border overflow-hidden animate-pulse"
            >
              <div className="w-full aspect-square bg-primary/5" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 w-2/3 bg-gray-100 rounded" />
                <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && words.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center pt-20"
        >
          <p className="font-body text-sm text-dark/40">
            Words you keep will settle here.
          </p>
        </motion.div>
      )}

      {!loading && words.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          {words.map((w) => (
            <GroveCard
              key={w.id}
              word={w}
              shimmer={hasShimmer(shimmerTopics, w.topic)}
              onOpen={setOpenWord}
            />
          ))}
        </motion.div>
      )}

      <GroveReplayModal word={openWord} onClose={() => setOpenWord(null)} />
    </div>
  );
}
