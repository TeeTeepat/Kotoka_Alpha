"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { WordData, SkillResult } from "@/types";
import { COMMON_WORDS } from "@/lib/commonWords";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";

interface FillBlankSkillProps {
  word: WordData;
  onComplete: (result: SkillResult) => void;
  onWrongAnswer?: () => void;
  words?: WordData[]; // other session words used as chip distractors
}

/** Replace first case-insensitive occurrence of target in sentence with ___ */
function blankSentence(sentence: string, target: string): string {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped, "i"), "___");
}

/** Build 6-chip bank: 1 correct + up to 3 deck words + fill with common words, shuffled */
function buildChips(targetWord: string, deckWords: WordData[]): string[] {
  const distractors = deckWords
    .map((w) => w.word)
    .filter((w) => w.toLowerCase() !== targetWord.toLowerCase());

  // Pick 3 deck distractors
  const deckPick: string[] = [];
  const shuffledDeck = [...distractors].sort(() => Math.random() - 0.5);
  for (const w of shuffledDeck) {
    if (deckPick.length >= 3) break;
    deckPick.push(w);
  }

  // Fill remaining slots from common words (need 5 distractors total)
  const needed = 5 - deckPick.length;
  const commonPick = COMMON_WORDS.filter(
    (w) => w.toLowerCase() !== targetWord.toLowerCase() && !deckPick.includes(w)
  )
    .sort(() => Math.random() - 0.5)
    .slice(0, needed);

  const all = [targetWord, ...deckPick, ...commonPick].slice(0, 6);
  // Shuffle
  return all.sort(() => Math.random() - 0.5);
}

const MAX_WRONG = 3;

export default function FillBlankSkill({
  word,
  onComplete,
  onWrongAnswer,
  words = [],
}: FillBlankSkillProps) {
  const { play } = useSoundPlayer();
  const [wrongCount, setWrongCount] = useState(0);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [answered, setAnswered] = useState<"correct" | null>(null);

  const sentence = useMemo(
    () => (word.example ? blankSentence(word.example, word.word) : `___ means "${word.translation}".`),
    [word]
  );

  // Build chips once per question mount
  const chips = useMemo(
    () => buildChips(word.word, words.filter((w) => w.id !== word.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [word.id]
  );

  const handleChipTap = (chip: string) => {
    if (answered) return;

    const correct = chip.toLowerCase() === word.word.toLowerCase();

    if (correct) {
      play("correct");
      setAnswered("correct");
      setTimeout(() => {
        onComplete({ skill: "fill-blank", correct: 1, total: 1, vocabularyUsed: [word.word], quality: 4 });
      }, 700);
    } else {
      play("wrong");
      setLastWrong(chip);
      onWrongAnswer?.();
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);
      setTimeout(() => setLastWrong(null), 500);

      if (newWrongCount >= MAX_WRONG) {
        // Give up after 3 wrong taps
        setTimeout(() => {
          onComplete({ skill: "fill-blank", correct: 0, total: 1, vocabularyUsed: [word.word], quality: 1 });
        }, 600);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Sentence display */}
      <div className="card-base p-5 space-y-3 relative overflow-hidden">
        {word.deckImage && (
          <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden rounded-t-card">
            <Image src={`data:image/jpeg;base64,${word.deckImage}`} alt="Scene" fill className="object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
          </div>
        )}
        <p className={`font-body text-xs text-gray-400 uppercase tracking-wide ${word.deckImage ? "mt-12" : ""}`}>Fill in the blank</p>
        <p className="font-heading font-bold text-lg text-dark leading-relaxed">
          {sentence.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <motion.span
                  animate={answered === "correct" ? { backgroundColor: "#d1fae5", color: "#065f46" } : {}}
                  className={`inline-block min-w-[80px] mx-1 px-3 py-0.5 rounded-xl border-2 text-center align-middle transition-colors ${
                    answered === "correct"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-dashed border-primary/40 bg-primary/5 text-gray-300"
                  }`}
                >
                  {answered === "correct" ? word.word : "___"}
                </motion.span>
              )}
            </span>
          ))}
        </p>

        <AnimatePresence>
          {answered === "correct" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-emerald-600"
            >
              <span className="text-lg">✓</span>
              <span className="font-body text-sm font-medium">Correct!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wrong attempt indicator */}
      {wrongCount > 0 && wrongCount < MAX_WRONG && (
        <p className="font-body text-xs text-red-400 text-center">
          {MAX_WRONG - wrongCount} {MAX_WRONG - wrongCount === 1 ? "try" : "tries"} left
        </p>
      )}

      {/* Chip bank */}
      <div className="flex flex-wrap gap-2 justify-center px-2">
        {chips.map((chip) => {
          const isWrong = lastWrong === chip;
          return (
            <motion.button
              key={chip}
              onClick={() => handleChipTap(chip)}
              disabled={!!answered}
              animate={isWrong ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={`px-4 py-2 rounded-2xl border-[1.5px] font-heading font-bold text-sm transition-colors select-none ${
                isWrong
                  ? "border-red-300 bg-red-50 text-red-500"
                  : "border-card-border bg-white text-dark hover:border-primary/40 hover:bg-primary/5 active:scale-95"
              } disabled:opacity-50`}
            >
              {chip}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
