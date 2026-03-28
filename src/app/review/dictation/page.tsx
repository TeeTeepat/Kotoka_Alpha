"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Volume2, RotateCcw, Check, X } from "lucide-react";
import type { DeckWithWords, WordData } from "@/types";

function DeckSelector({ decks, onSelect }: { decks: DeckWithWords[]; onSelect: (d: DeckWithWords) => void }) {
  return (
    <div className="space-y-3">
      {decks.map((deck, i) => (
        <motion.button key={deck.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(deck)}
          className="w-full card-base p-4 text-left flex items-center gap-3 hover:shadow-card-hover transition-all">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-extrabold"
            style={{ background: `linear-gradient(135deg, ${deck.colorPalette}, ${deck.colorPalette}cc)` }}>
            {deck.words.length}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-extrabold text-sm text-dark capitalize truncate">{deck.sceneDesc}</p>
            <p className="font-body text-xs text-gray-400">{deck.words.length} words</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

function DictationSession({ deck, onExit }: { deck: DeckWithWords; onExit: () => void }) {
  const words = deck.words;
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [replays, setReplays] = useState(0);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentWord: WordData = words[index];

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(currentWord.word);
    utt.rate = 0.85;
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
    setReplays(r => r + 1);
  };

  useEffect(() => {
    setInput("");
    setResult(null);
    setReplays(0);
    speak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const submit = () => {
    const correct = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setResult(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    if (index + 1 >= words.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
    }
  };

  if (done) {
    const pct = Math.round((score / words.length) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="card-base p-6 flex flex-col items-center gap-4 text-center mt-8">
        <span className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📝"}</span>
        <h2 className="font-heading font-extrabold text-xl text-dark">Dictation Complete!</h2>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-emerald-400" />
        </div>
        <p className="font-heading font-extrabold text-3xl text-dark">{pct}%</p>
        <p className="font-body text-sm text-gray-500">{score} / {words.length} correct</p>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onExit} className="btn-aqua w-full py-3.5">Back to Decks</motion.button>
      </motion.div>
    );
  }

  return (
    <div className="py-4 space-y-5">
      <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-emerald-400"
          animate={{ width: `${(index / words.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <p className="font-body text-xs text-gray-400 text-center">{index + 1} / {words.length}</p>

      <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card-base p-6 flex flex-col items-center gap-5">
        <p className="font-body text-sm text-gray-500">Listen and type what you hear</p>

        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={speak} disabled={replays >= 3}
            className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center disabled:opacity-40">
            <Volume2 className="w-6 h-6 text-emerald-600" />
          </motion.button>
          {replays > 0 && replays < 3 && (
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={speak}
              className="flex items-center gap-1 text-xs font-body text-gray-400 hover:text-gray-600">
              <RotateCcw className="w-3.5 h-3.5" /> Replay ({3 - replays} left)
            </motion.button>
          )}
          {replays >= 3 && <p className="font-body text-xs text-gray-400">No more replays</p>}
        </div>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !result && submit()}
          disabled={!!result}
          placeholder="Type the word..."
          className="w-full border-2 border-card-border rounded-2xl px-4 py-3 font-heading font-extrabold text-lg text-dark text-center focus:outline-none focus:border-primary transition-colors"
        />

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-3">
              <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-extrabold text-sm ${
                result === "correct" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
              }`}>
                {result === "correct" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {result === "correct" ? "Correct!" : `Answer: ${currentWord.word}`}
              </div>
              {result === "wrong" && (
                <p className="font-body text-xs text-gray-500 text-center">
                  You typed: <span className="text-red-400 font-medium">{input}</span>
                </p>
              )}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={next} className="btn-aqua w-full py-3">
                {index + 1 >= words.length ? "See Results" : "Next →"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.button key="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={submit} disabled={!input.trim()}
              className="btn-aqua w-full py-3 disabled:opacity-40">
              Submit
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function DictationPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithWords[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DeckWithWords | null>(null);

  useEffect(() => {
    fetch("/api/decks").then(r => r.json())
      .then(d => { setDecks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="py-4 space-y-5">
      <div className="flex items-center gap-3">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => active ? setActive(null) : router.push("/review")}
          className="w-9 h-9 rounded-full bg-white border-[1.5px] border-card-border shadow-card flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-dark" />
        </motion.button>
        <div>
          <h1 className="font-heading font-extrabold text-xl text-dark">Dictation</h1>
          <p className="font-body text-sm text-gray-500">{active ? active.sceneDesc : "Choose a deck"}</p>
        </div>
      </div>

      {active ? (
        <DictationSession deck={active} onExit={() => setActive(null)} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="card-base p-4 animate-pulse h-16 rounded-2xl bg-gray-50" />)}
        </div>
      ) : decks.length === 0 ? (
        <div className="card-base p-8 text-center">
          <p className="font-body text-sm text-gray-400">No decks yet. Snap a photo first!</p>
        </div>
      ) : (
        <DeckSelector decks={decks} onSelect={setActive} />
      )}
    </div>
  );
}
