"use client";

import { useMemo, useId } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, BookOpen } from "lucide-react";
import type { DeckWithWords } from "@/types";

interface ForgettingCurveWidgetProps {
  decks: DeckWithWords[];
  loading: boolean;
}

export default function ForgettingCurveWidget({ decks, loading }: ForgettingCurveWidgetProps) {
  const router = useRouter();
  const gradientId = useId().replace(/:/g, "");

  const { words, buckets, curvePoints } = useMemo(() => {
    const allWords = decks.flatMap(d => d.words);
    const now = Date.now();

    // Count badges
    const buckets = {
      NOW:  allWords.filter(w => new Date(w.nextReviewAt).getTime() <= now).length,
      "1h": allWords.filter(w => new Date(w.nextReviewAt).getTime() <= now + 3_600_000).length,
      "6h": allWords.filter(w => new Date(w.nextReviewAt).getTime() <= now + 21_600_000).length,
      "1d": allWords.filter(w => new Date(w.nextReviewAt).getTime() <= now + 86_400_000).length,
      "7d": allWords.filter(w => new Date(w.nextReviewAt).getTime() <= now + 604_800_000).length,
    };

    // Retention formula: R(t) = e^(-t_ms / (interval_days * 86400 * 1000))
    const getRetention = (word: typeof allWords[0], atTime: number): number => {
      const stabilityMs = Math.max(word.interval, 1) * 86_400_000;
      const lastReview = word.lastReviewedAt
        ? new Date(word.lastReviewedAt).getTime()
        : new Date(word.nextReviewAt).getTime() - stabilityMs;
      const elapsed = atTime - lastReview;
      return Math.exp(-Math.max(elapsed, 0) / stabilityMs) * 100;
    };

    // Build 30 SVG points over 7 days
    const sevenDays = 7 * 86_400_000;
    const curvePoints = allWords.length === 0 ? [] : Array.from({ length: 30 }, (_, i) => {
      const t = now + (i / 29) * sevenDays;
      const avgRetention = allWords.reduce((sum, w) => sum + getRetention(w, t), 0) / allWords.length;
      const x = (i / 29) * 280 + 10; // 10px padding each side, 280px usable
      const y = 90 - (avgRetention / 100) * 80; // 10px top pad, 80px usable, Y inverted
      return { x, y };
    });

    return { words: allWords, buckets, curvePoints };
  }, [decks]);

  const urgentCount = buckets.NOW;
  const pathD = curvePoints.length > 0
    ? `M ${curvePoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`
    : "";
  const fillD = curvePoints.length > 0
    ? `${pathD} L ${curvePoints[curvePoints.length - 1].x},90 L ${curvePoints[0].x},90 Z`
    : "";

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="card-base p-4 animate-pulse"
      >
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="h-24 bg-gray-100 rounded mb-3" />
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-6 w-12 bg-gray-100 rounded-full" />)}
        </div>
      </motion.div>
    );
  }

  if (words.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
    >
      <div className="card-base p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-extrabold text-sm text-dark">Forgetting Curve</h3>
            </div>
            <p className="font-body text-xs text-gray-400 mt-0.5">
              {urgentCount > 0
                ? `${urgentCount} word${urgentCount !== 1 ? "s" : ""} need urgent review`
                : "All words are on track"}
            </p>
          </div>
          {urgentCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/review")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full font-body text-xs font-semibold flex-shrink-0 hover:bg-orange-200 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              Save them now!
            </motion.button>
          )}
        </div>

        {/* SVG forgetting curve */}
        <svg viewBox="0 0 300 100" className="w-full h-24" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1ad3e2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1ad3e2" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Y axis ticks */}
          <line x1="10" y1="10" x2="10" y2="90" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="10" y1="90" x2="290" y2="90" stroke="#e5e7eb" strokeWidth="1" />
          {/* 70% threshold line (y = 90 - 0.7*80 = 34) */}
          <line x1="10" y1="34" x2="290" y2="34" stroke="#f97316" strokeWidth="1" strokeDasharray="4 3" />
          <text x="12" y="32" fontSize="7" fill="#f97316" fontFamily="sans-serif">70%</text>
          {/* Fill under curve */}
          {fillD && <path d={fillD} fill={`url(#${gradientId})`} />}
          {/* Curve line */}
          {pathD && <path d={pathD} fill="none" stroke="#1ad3e2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
          {/* X axis labels */}
          <text x="10" y="99" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">Now</text>
          <text x="63" y="99" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">1d</text>
          <text x="143" y="99" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">3d</text>
          <text x="275" y="99" fontSize="6" fill="#9ca3af" fontFamily="sans-serif">7d</text>
        </svg>

        {/* Count badges */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(buckets).map(([label, count]) => (
            <span
              key={label}
              className={`px-2.5 py-1 rounded-full font-body text-xs font-semibold ${
                label === "NOW" && count > 0
                  ? "bg-red-100 text-red-700"
                  : count > 0
                  ? "bg-orange-50 text-orange-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {label}: {count}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
