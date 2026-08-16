"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import type { WordData } from "@/types";

export default function RecentWordsStrip({ words }: { words: WordData[] }) {
  const { t } = useLocale();
  const recent = words.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="card-base p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-heading font-extrabold text-sm text-dark">{t.dashRecentWords}</h2>
      </div>

      {recent.length === 0 ? (
        <p className="font-body text-xs text-gray-400 text-center py-2">{t.dashRecentWordsEmpty}</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {recent.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex-shrink-0 rounded-2xl bg-primary/5 border border-primary/10 px-3 py-2 min-w-[92px]"
            >
              <p className="font-heading font-bold text-sm text-dark truncate">{w.word}</p>
              <p className="font-body text-[11px] text-gray-400 truncate">{w.translation}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
