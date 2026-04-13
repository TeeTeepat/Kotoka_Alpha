"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import type { WordData, SkillResult, SessionState } from "@/types";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";

interface FlashcardsSkillProps {
  words: WordData[];
  exercisePrompts: SessionState["exercisePrompts"];
  onComplete: (result: SkillResult) => void;
  onWrongAnswer?: () => void;
}

export default function FlashcardsSkill({ words, onComplete, onWrongAnswer }: FlashcardsSkillProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ wordId: string; correct: boolean }[]>([]);
  const { play } = useSoundPlayer();

  useEffect(() => { setFlipped(false); }, [index]);

  if (words.length === 0) {
    onComplete({ skill: "flashcards", correct: 0, total: 0, vocabularyUsed: [] });
    return null;
  }

  const word = words[index];
  const done = index >= words.length;

  const handleRate = (quality: number) => {
    const correct = quality >= 3;
    if (correct) {
      play("correct");
    } else {
      play("wrong");
      // Only deduct a heart for "Again" (total miss) — "Hard" is still a pass
      if (quality <= 1) onWrongAnswer?.();
    }

    setResults((r) => [...r, { wordId: word.id, correct }]);

    if (index + 1 >= words.length) {
      const finalResults = [...results, { wordId: word.id, correct }];
      const correctCount = finalResults.filter((r) => r.correct).length;
      onComplete({
        skill: "flashcards",
        correct: correctCount,
        total: finalResults.length,
        vocabularyUsed: words.map((w) => w.word),
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (done) return null;

  const progress = (index / words.length) * 100;

  return (
    <div className="space-y-4">
      <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>
      <p className="font-body text-xs text-gray-400 text-center">{index + 1} / {words.length}</p>

      <div className="perspective-1000 w-full" style={{ height: word.deckImage ? 260 : 220 }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-full cursor-pointer"
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Front */}
          <div style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 rounded-card border-[1.5px] border-card-border shadow-card bg-white flex flex-col items-center justify-center p-6 gap-2 overflow-hidden">
            {/* FIX 6: deck photo banner */}
            {word.deckImage && (
              <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden rounded-t-card">
                <Image
                  src={`data:image/jpeg;base64,${word.deckImage}`}
                  alt="Scene"
                  fill
                  className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
              </div>
            )}
            <div className={`w-10 h-1.5 rounded-full mb-2 bg-primary ${word.deckImage ? "mt-12" : ""}`} />
            <h2 className="font-heading font-extrabold text-3xl text-dark">{word.word}</h2>
            <p className="font-body text-sm text-gray-400">{word.phonetic}</p>
            <p className="font-body text-xs text-gray-300 mt-2">Tap to reveal</p>
          </div>
          {/* Back */}
          <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className="absolute inset-0 rounded-card border-[1.5px] shadow-card bg-white flex flex-col justify-between p-5">
            <div>
              <p className="font-body text-xs text-gray-400 mb-1">Translation</p>
              <p className="font-heading font-extrabold text-xl text-dark">{word.translation}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="font-body text-xs text-dark leading-relaxed">{word.example}</p>
            </div>
            <p className="font-body text-[10px] text-gray-300 text-center">Tap to flip back</p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {flipped && (
          <motion.div key="buttons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} className="grid grid-cols-4 gap-2">
            {[
              { q: 1, label: "Again", color: "border-red-200 bg-red-50 text-red-500 hover:bg-red-100" },
              { q: 2, label: "Hard", color: "border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100" },
              { q: 4, label: "Good", color: "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100" },
              { q: 5, label: "Easy", color: "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
            ].map(({ q, label, color }) => (
              <motion.button key={q} whileTap={{ scale: 0.96 }}
                onClick={() => handleRate(q)}
                className={`flex flex-col items-center gap-0.5 py-3 rounded-2xl border-[1.5px] font-heading font-extrabold text-xs transition-colors ${color}`}>
                <span>{label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
