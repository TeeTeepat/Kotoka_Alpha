"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Volume2, RotateCcw, Check, X } from "lucide-react";
import Image from "next/image";
import type { WordData, SkillResult, SessionState } from "@/types";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";

interface DictationSkillProps {
  words: WordData[];
  exercisePrompts: SessionState["exercisePrompts"];
  onComplete: (result: SkillResult) => void;
  onWrongAnswer?: () => void;
}

export default function DictationSkill({ words, onComplete, onWrongAnswer }: DictationSkillProps) {
  const dictationWords = words.slice(0, 3);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [replays, setReplays] = useState(0);
  const [score, setScore] = useState(0);
  const { play } = useSoundPlayer();

  const currentWord = dictationWords[index];

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis || !currentWord) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(currentWord.word);
    utt.rate = 0.85;
    utt.onerror = () => {};
    window.speechSynthesis.speak(utt);
    setReplays((r) => r + 1);
  };

  useEffect(() => {
    setInput("");
    setResult(null);
    setReplays(0);
    if (currentWord) speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (dictationWords.length === 0) {
    onComplete({ skill: "dictation", correct: 0, total: 0, vocabularyUsed: [] });
    return null;
  }

  const submit = () => {
    if (!currentWord) return;
    const correct = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setResult(correct ? "correct" : "wrong");
    if (correct) {
      setScore((s) => s + 1);
      play("correct");
    } else {
      play("wrong");
      onWrongAnswer?.();
    }
  };

  const next = () => {
    if (index + 1 >= dictationWords.length) {
      onComplete({
        skill: "dictation",
        correct: score,
        total: dictationWords.length,
        vocabularyUsed: dictationWords.map((w) => w.word),
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-extrabold text-sm text-dark">Dictation</h3>
        <span className="text-xs font-body text-gray-400">{index + 1}/{dictationWords.length}</span>
      </div>

      <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-emerald-400"
          animate={{ width: `${(index / dictationWords.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card-base p-6 flex flex-col items-center gap-5 relative overflow-hidden">
        {currentWord?.deckImage && (
          <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden rounded-t-card">
            <Image src={`data:image/jpeg;base64,${currentWord.deckImage}`} alt="Scene" fill className="object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
          </div>
        )}
        <p className={`font-body text-sm text-gray-500 ${currentWord?.deckImage ? "mt-12" : ""}`}>Listen and type what you hear</p>

        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.92 }} onClick={speak} disabled={replays >= 3}
            className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center disabled:opacity-40">
            <Volume2 className="w-6 h-6 text-emerald-600" />
          </motion.button>
          {replays > 0 && replays < 3 && (
            <button onClick={speak} className="flex items-center gap-1 text-xs font-body text-gray-400 hover:text-gray-600">
              <RotateCcw className="w-3.5 h-3.5" /> Replay ({3 - replays} left)
            </button>
          )}
          {replays >= 3 && <p className="font-body text-xs text-gray-400">No more replays</p>}
        </div>

        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !result && submit()} disabled={!!result}
          placeholder="Type the word..."
          className="w-full border-2 border-card-border rounded-2xl px-4 py-3 font-heading font-extrabold text-lg text-dark text-center focus:outline-none focus:border-primary transition-colors" />

        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-3">
            <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-extrabold text-sm ${
              result === "correct" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            }`}>
              {result === "correct" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {result === "correct" ? "Correct!" : `Answer: ${currentWord?.word}`}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={next} className="btn-aqua w-full py-3">
              {index + 1 >= dictationWords.length ? "Continue" : "Next"}
            </motion.button>
          </motion.div>
        )}

        {!result && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={!input.trim()}
            className="btn-aqua w-full py-3 disabled:opacity-40">Submit</motion.button>
        )}
      </motion.div>
    </div>
  );
}
