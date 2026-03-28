"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, BookOpen, Layers, Clock } from "lucide-react";
import type { DeckWithWords, WordData } from "@/types";

// ─── SM-2 Algorithm ───────────────────────────────────────────────────────────
type Quality = 0 | 3 | 5; // Bad=0, Good=3, Perfect=5

function applySM2(word: WordData, quality: Quality): { easeFactor: number; interval: number; nextReviewAt: string } {
  let { easeFactor, interval } = word;

  if (quality < 3) {
    interval = 1;
  } else {
    interval = interval <= 1 ? 6 : Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);
  return { easeFactor, interval, nextReviewAt: nextReviewAt.toISOString() };
}

function nextIntervalDays(word: WordData | undefined, quality: Quality): number {
  if (quality < 3) return 1;
  if (!word || word.interval <= 1) return 6;
  return Math.round(word.interval * word.easeFactor);
}

// ─── Flashcard (3D flip) ──────────────────────────────────────────────────────
function Flashcard({ word, colorPalette }: { word: WordData; colorPalette: string }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => setFlipped(false), [word.id]);

  return (
    <div className="perspective-1000 w-full" style={{ height: 220 }}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-full cursor-pointer"
        onClick={() => setFlipped(f => !f)}
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className="absolute inset-0 rounded-card border-[1.5px] border-card-border shadow-card bg-white flex flex-col items-center justify-center p-6 gap-2"
        >
          <div className="w-10 h-1.5 rounded-full mb-2" style={{ backgroundColor: colorPalette }} />
          <h2 className="font-heading font-extrabold text-3xl text-dark">{word.word}</h2>
          <p className="font-body text-sm text-gray-400">{word.phonetic}</p>
          <p className="font-body text-xs text-gray-300 mt-2">Tap to reveal</p>
        </div>

        {/* Back */}
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className="absolute inset-0 rounded-card border-[1.5px] shadow-card flex flex-col justify-between p-5"
        >
          <div>
            <p className="font-body text-xs text-gray-400 mb-1">Translation</p>
            <p className="font-heading font-extrabold text-xl text-dark">{word.translation}</p>
          </div>
          <div className="bg-background rounded-xl p-3 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="font-body text-xs text-dark leading-relaxed">{word.example}</p>
          </div>
          <p className="font-body text-[10px] text-gray-300 text-center">Tap to flip back</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Study Session ─────────────────────────────────────────────────────────────
function StudySession({ deck, onExit }: { deck: DeckWithWords; onExit: () => void }) {
  const sorted = [...deck.words].sort((a, b) => {
    const aScore = Date.now() - new Date(a.nextReviewAt).getTime();
    const bScore = Date.now() - new Date(b.nextReviewAt).getTime();
    return bScore - aScore; // most overdue first
  });

  const [index, setIndex] = useState(0);
  const [ratings, setRatings] = useState<{ bad: number; good: number; perfect: number }>({ bad: 0, good: 0, perfect: 0 });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handle = useCallback(async (quality: Quality) => {
    if (submitting) return;
    const word = sorted[index];
    const srsUpdate = applySM2(word, quality);

    setRatings(r => ({
      bad: r.bad + (quality === 0 ? 1 : 0),
      good: r.good + (quality === 3 ? 1 : 0),
      perfect: r.perfect + (quality === 5 ? 1 : 0),
    }));
    setSubmitting(true);

    if (index + 1 >= sorted.length) {
      setDone(true);
      try {
        const stats = JSON.parse(localStorage.getItem("kotoka-stats") || '{"hearts":5,"streak":0,"coins":0,"wordsLearned":0}');
        stats.coins += 5;
        localStorage.setItem("kotoka-stats", JSON.stringify(stats));
        window.dispatchEvent(new Event("kotoka-stats-update"));
      } catch { /* ignore */ }
    } else {
      setIndex(i => i + 1);
    }

    try {
      await fetch(`/api/words/${word.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(srsUpdate),
      });
    } catch { /* ignore */ }

    setSubmitting(false);
  }, [submitting, index, sorted]);

  const currentWord = sorted[index];
  const overdueMs = currentWord ? Date.now() - new Date(currentWord.nextReviewAt).getTime() : 0;
  const overdueDays = Math.floor(Math.abs(overdueMs) / 86400000);

  const ratingButtons: { quality: Quality; label: string; emoji: string; color: string }[] = [
    { quality: 0, label: "Bad", emoji: "😞", color: "border-red-200 bg-red-50 text-red-500 hover:bg-red-100" },
    { quality: 3, label: "Good", emoji: "🙂", color: "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100" },
    { quality: 5, label: "Perfect", emoji: "🤩", color: "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
  ];

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-white border-[1.5px] border-card-border shadow-card flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 text-dark" />
        </motion.button>
        <div className="flex-1">
          <h1 className="font-heading font-extrabold text-base text-dark capitalize truncate">{deck.sceneDesc}</h1>
          {!done && <p className="font-body text-xs text-gray-400">{index + 1} / {sorted.length}</p>}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={`card-${index}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="space-y-4">

            {/* Progress bar */}
            <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-primary"
                animate={{ width: `${(index / sorted.length) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>

            {/* Due indicator */}
            {overdueMs > 0 && (
              <div className="flex items-center gap-1.5 text-amber-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-body text-xs">
                  {overdueDays > 0 ? `${overdueDays}d overdue` : "Due today"}
                </span>
              </div>
            )}

            <Flashcard word={currentWord} colorPalette={deck.colorPalette} />

            {/* SM-2 rating buttons */}
            <div className="grid grid-cols-3 gap-2">
              {currentWord && ratingButtons.map(({ quality, label, emoji, color }) => {
                const days = nextIntervalDays(currentWord, quality);
                return (
                  <motion.button
                    key={quality}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                    onClick={() => handle(quality)}
                    disabled={submitting}
                    className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-2xl border-[1.5px] font-heading font-extrabold text-sm transition-colors disabled:opacity-50 ${color}`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-xs">{label}</span>
                    <span className="text-[10px] font-body font-normal opacity-70">+{days}d</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="card-base p-6 flex flex-col items-center gap-4 text-center">
            <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6 }} className="text-5xl">🎉</motion.div>
            <h2 className="font-heading font-extrabold text-xl text-dark">Session Complete!</h2>

            {/* Rating summary */}
            <div className="flex gap-6 w-full justify-center">
              {[
                { emoji: "😞", count: ratings.bad, label: "Bad", color: "text-red-500" },
                { emoji: "🙂", count: ratings.good, label: "Good", color: "text-amber-500" },
                { emoji: "🤩", count: ratings.perfect, label: "Perfect", color: "text-emerald-500" },
              ].map(({ emoji, count, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl">{emoji}</span>
                  <span className={`font-heading font-extrabold text-lg ${color}`}>{count}</span>
                  <span className="font-body text-xs text-gray-400">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-gold/10 text-gold font-heading font-extrabold text-sm px-4 py-2 rounded-full">
              🪙 +5 KotoCoins earned!
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={onExit} className="btn-aqua w-full py-3.5 mt-2">
              Back to Decks
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Deck List Item ────────────────────────────────────────────────────────────
function DeckItem({ deck, onSelect, index }: { deck: DeckWithWords; onSelect: () => void; index: number }) {
  const atmosphereEmoji: Record<string, string> = { quiet: "🤫", ambient: "☕", noisy: "🔊", energizing: "⚡" };
  const soundEmoji: Record<string, string> = { city: "🏙️", office: "💼", rain: "🌧️", cafe: "☕", transit: "🚇" };
  const date = new Date(deck.createdAt).toLocaleDateString("en-TH", { month: "short", day: "numeric" });

  const dueCount = deck.words.filter(w => new Date(w.nextReviewAt).getTime() <= Date.now()).length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="w-full card-base p-4 text-left flex items-center gap-4 hover:shadow-card-hover transition-all"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-heading font-extrabold text-lg"
        style={{ background: `linear-gradient(135deg, ${deck.colorPalette}, ${deck.colorPalette}cc)` }}
      >
        {deck.words.length}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-extrabold text-sm text-dark capitalize truncate">{deck.sceneDesc}</p>
        <p className="font-body text-xs text-gray-400 mt-0.5">
          {atmosphereEmoji[deck.atmosphere]} {deck.atmosphere} · {soundEmoji[deck.ambientSound]} · {date}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {dueCount > 0 && (
          <span className="text-[10px] font-heading font-extrabold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
            {dueCount} due
          </span>
        )}
        <Layers className="w-4 h-4 text-gray-400" />
      </div>
    </motion.button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const [decks, setDecks] = useState<DeckWithWords[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DeckWithWords | null>(null);

  useEffect(() => {
    fetch("/api/decks")
      .then(r => r.json())
      .then(data => { setDecks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [active]);

  if (active) return <StudySession deck={active} onExit={() => setActive(null)} />;

  const totalDue = decks.reduce((acc, d) =>
    acc + d.words.filter(w => new Date(w.nextReviewAt).getTime() <= Date.now()).length, 0);

  return (
    <div className="py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-extrabold text-xl text-dark">My Decks</h1>
        <p className="font-body text-sm text-gray-500">
          {decks.length} deck{decks.length !== 1 ? "s" : ""}
          {totalDue > 0 && <span className="text-amber-500 ml-1">· {totalDue} words due</span>}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-base p-4 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card-base p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">📭</span>
          <p className="font-heading font-extrabold text-dark">No decks yet</p>
          <p className="font-body text-sm text-gray-400">Snap a photo to create your first vocabulary deck!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck, i) => (
            <DeckItem key={deck.id} deck={deck} index={i} onSelect={() => setActive(deck)} />
          ))}
        </div>
      )}

      {decks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="card-base p-4 flex items-center justify-around">
          {[
            { label: "Decks", value: decks.length, emoji: "🗂️" },
            { label: "Words", value: decks.reduce((a, d) => a + d.words.length, 0), emoji: "📚" },
            { label: "Due", value: totalDue, emoji: "⏰" },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-xl">{emoji}</span>
              <span className="font-heading font-extrabold text-lg text-dark">{value}</span>
              <span className="font-body text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
