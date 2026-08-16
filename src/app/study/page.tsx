"use client";

// /study — the Study tab.
//
// (a) Atmospheric flashcard review: words due per the fixed SRS ladder,
//     each card recreating the scene it was snapped in (scene photo +
//     ambient sound + weather/time tint at snap time) for environmental
//     memory anchoring.
// (b) Guided path activities: cards into the /daily flexible steps
//     (Listen, Flashcard, Read/Write, Dictation).
//
// No coins or scores are awarded in review — gamification is hidden here.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import AtmosphericFlashcard, { type AtmosphericWord } from "@/components/study/AtmosphericFlashcard";
import GuidedPathSection from "@/components/study/GuidedPathSection";
import StudyEmptyState from "@/components/study/StudyEmptyState";

export default function StudyPage() {
  const { t } = useLocale();
  const [words, setWords] = useState<AtmosphericWord[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/study-atmosphere");
        if (res.ok) {
          const data = await res.json();
          setWords(data.words ?? []);
        }
      } catch (err) {
        console.error("[StudyPage] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAnswer = async (gotIt: boolean) => {
    const word = words[index];
    if (!word) return;
    // Advance locally first so the review feels instant.
    setIndex((i) => i + 1);
    try {
      await fetch("/api/study-atmosphere/answer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.id, gotIt }),
      });
    } catch (err) {
      console.error("[StudyPage] Failed to record answer:", err);
    }
  };

  const current = words[index];
  const remaining = Math.max(0, words.length - index);

  return (
    <div className="py-4 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-extrabold text-xl text-dark">{t.studyTitle}</h1>
        <p className="font-body text-sm text-gray-500">
          {remaining > 0 ? `${remaining} ${t.studyWordsReady}` : t.studyAllCaughtUp}
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : current ? (
        <AtmosphericFlashcard key={current.id} word={current} onAnswer={handleAnswer} />
      ) : (
        <StudyEmptyState />
      )}

      <GuidedPathSection />
    </div>
  );
}
