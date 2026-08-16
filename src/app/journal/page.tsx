"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import SandboxWorld from "@/components/world/SandboxWorld";
import GroveCard from "@/components/grove/GroveCard";
import GroveReplayModal from "@/components/grove/GroveReplayModal";
import { hasShimmer, useShimmerTopics } from "@/components/world/ShimmerOverlay";
import { useLocale } from "@/lib/i18n";
import type { GroveResponse, GroveWord } from "@/components/grove/types";

/**
 * The Journal: the Living Sandbox world up top, then a grid below — one
 * cropped card per promoted word, cut from the photo it was found in.
 * Outside the session loop. Gates nothing, counts nothing, shows no
 * percentages — a quiet shelf of things the learner has kept.
 */
export default function JournalPage() {
  const { t } = useLocale();
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
    <div className="pb-24">
      <SandboxWorld />

      <div className="max-w-lg mx-auto px-4 pt-6">
        <h2 className="font-heading font-extrabold text-lg text-dark mb-1">
          {t.journalTitle}
        </h2>
        <p className="font-body text-xs text-gray-400 mb-4">{t.journalSubtitle}</p>

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
            className="text-center pt-10 pb-6"
          >
            <p className="font-body text-sm text-dark/40 mb-4">
              {t.journalEmptyTitle}
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
      </div>

      <GroveReplayModal word={openWord} onClose={() => setOpenWord(null)} />
    </div>
  );
}
