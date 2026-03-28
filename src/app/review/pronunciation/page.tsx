"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Mic, MicOff, ChevronRight } from "lucide-react";
import type { DeckWithWords, WordData } from "@/types";

// ─── Syllabification ─────────────────────────────────────────────────────────
function syllabify(word: string): string[] {
  // Simple universal syllabifier: split on vowel-consonant boundaries
  const vowels = /[aeiouáéíóúàèìòùäëïöüāēīōūæøåยาิีึืุูเแโใไaeiou]/i;
  const letters = word.toLowerCase().split("");
  const syllables: string[] = [];
  let current = "";

  for (let i = 0; i < letters.length; i++) {
    current += letters[i];
    const isVowelNow = vowels.test(letters[i]);
    const nextIsConsonant = i + 1 < letters.length && !vowels.test(letters[i + 1]);
    const nextNextIsVowel = i + 2 < letters.length && vowels.test(letters[i + 2]);
    if (isVowelNow && nextIsConsonant && nextNextIsVowel && current.length >= 2) {
      syllables.push(current);
      current = "";
    }
  }
  if (current) syllables.push(current);
  return syllables.length ? syllables : [word];
}

// Score 0-1 similarity between spoken text and target syllable
function syllableScore(spoken: string, target: string): number {
  const s = spoken.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (s === t) return 1;
  if (s.includes(t) || t.includes(s)) return 0.7;
  let matches = 0;
  for (let i = 0; i < Math.min(s.length, t.length); i++) {
    if (s[i] === t[i]) matches++;
  }
  return matches / Math.max(s.length, t.length);
}

function scoreColor(score: number): string {
  if (score >= 0.8) return "#1ad3e2";      // blue — correct
  if (score >= 0.5) return "#f59e0b";      // amber — close
  return "#ef4444";                         // red — wrong
}

// ─── Speech Recognition hook ─────────────────────────────────────────────────
interface SpeechRec {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecClass = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(!!SpeechRecClass);
    if (!SpeechRecClass) return;
    const rec: SpeechRec = new SpeechRecClass();
    rec.continuous = false;
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, []);

  const start = (lang?: string) => {
    if (!recRef.current) return;
    setTranscript("");
    if (lang) recRef.current.lang = lang;
    recRef.current.start();
    setListening(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return { supported, transcript, listening, start, stop };
}

// ─── Heatmap component ────────────────────────────────────────────────────────
function SyllableHeatmap({ syllables, scores }: { syllables: string[]; scores: number[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {syllables.map((syl, i) => {
        const score = scores[i] ?? 0;
        const bg = scoreColor(score);
        return (
          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
            className="flex flex-col items-center gap-1">
            <div className="px-3 py-2 rounded-xl font-heading font-extrabold text-sm text-white"
              style={{ backgroundColor: bg }}>
              {syl}
            </div>
            <span className="font-body text-[10px] text-gray-400">{Math.round(score * 100)}%</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Word practice ────────────────────────────────────────────────────────────
function PronunciationSession({ deck, onExit }: { deck: DeckWithWords; onExit: () => void }) {
  const words = deck.words;
  const [index, setIndex] = useState(0);
  const [syllables, setSyllables] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const { supported, transcript, listening, start, stop } = useSpeechRecognition();

  const currentWord: WordData = words[index];

  useEffect(() => {
    const syls = syllabify(currentWord.word);
    setSyllables(syls);
    setScores([]);
    setOverallScore(null);
  }, [index, currentWord.word]);

  useEffect(() => {
    if (!transcript || syllables.length === 0) return;
    // Distribute the transcript across syllables
    const spokenParts = transcript.toLowerCase().split(/\s+/);
    const syllableScores = syllables.map((syl, i) => {
      const part = spokenParts[i] ?? transcript.toLowerCase();
      return syllableScore(part, syl);
    });
    const overall = syllableScores.reduce((a, b) => a + b, 0) / syllableScores.length;
    setScores(syllableScores);
    setOverallScore(overall);
  }, [transcript, syllables]);

  const next = () => {
    if (overallScore !== null) setSessionScores(s => [...s, overallScore]);
    if (index + 1 >= words.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
    }
  };

  if (done) {
    const avg = sessionScores.length
      ? Math.round((sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) * 100)
      : 0;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="card-base p-6 flex flex-col items-center gap-4 text-center mt-8">
        <span className="text-5xl">{avg >= 80 ? "🎤" : avg >= 50 ? "👍" : "📢"}</span>
        <h2 className="font-heading font-extrabold text-xl text-dark">Pronunciation Complete!</h2>
        <p className="font-heading font-extrabold text-4xl" style={{ color: scoreColor(avg / 100) }}>{avg}%</p>
        <p className="font-body text-sm text-gray-500">Overall accuracy across {words.length} words</p>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onExit} className="btn-aqua w-full py-3.5">Back to Decks</motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: "#1ad3e2" }}
          animate={{ width: `${(index / words.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="card-base p-6 flex flex-col items-center gap-5">
          <p className="font-body text-xs text-gray-400">{index + 1} / {words.length}</p>
          <h2 className="font-heading font-extrabold text-4xl text-dark">{currentWord.word}</h2>
          <p className="font-body text-sm text-gray-400">{currentWord.phonetic}</p>

          {/* Syllable preview */}
          <div className="flex gap-2 flex-wrap justify-center">
            {syllables.map((syl, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-gray-100 font-body text-sm text-gray-600">{syl}</span>
            ))}
          </div>

          {/* Mic button */}
          {!supported ? (
            <div className="card-base p-4 text-center bg-amber-50 border-amber-200">
              <p className="font-body text-sm text-amber-600">Pronunciation requires Chrome or Edge browser.</p>
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={() => listening ? stop() : start()}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all ${
                listening
                  ? "bg-red-50 border-red-300 animate-pulse"
                  : "bg-primary/10 border-primary"
              }`}>
              {listening
                ? <MicOff className="w-8 h-8 text-red-500" />
                : <Mic className="w-8 h-8 text-primary" />}
            </motion.button>
          )}

          {listening && <p className="font-body text-sm text-gray-400 animate-pulse">Listening…</p>}

          {/* Heatmap result */}
          {scores.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-3">
              <SyllableHeatmap syllables={syllables} scores={scores} />
              <div className="text-center">
                <span className="font-heading font-extrabold text-2xl" style={{ color: scoreColor(overallScore ?? 0) }}>
                  {Math.round((overallScore ?? 0) * 100)}%
                </span>
                <span className="font-body text-sm text-gray-400 ml-2">accuracy</span>
              </div>
              <p className="font-body text-xs text-gray-400 text-center">
                You said: <span className="text-dark font-medium">&ldquo;{transcript}&rdquo;</span>
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {scores.length > 0 && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={next} className="btn-aqua w-full py-3.5">
          {index + 1 >= words.length ? "See Results" : "Next →"}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PronunciationPage() {
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
          <h1 className="font-heading font-extrabold text-xl text-dark">Pronunciation</h1>
          <p className="font-body text-sm text-gray-500">{active ? active.sceneDesc : "Syllable heatmap analysis"}</p>
        </div>
      </div>

      {active ? (
        <PronunciationSession deck={active} onExit={() => setActive(null)} />
      ) : loading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="card-base h-14 animate-pulse" />)}</div>
      ) : decks.length === 0 ? (
        <div className="card-base p-8 text-center">
          <p className="font-body text-sm text-gray-400">No decks yet. Snap a photo first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {decks.map((deck, i) => (
            <motion.button key={deck.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActive(deck)}
              className="w-full card-base p-4 text-left flex items-center gap-3 hover:shadow-card-hover transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-extrabold flex-shrink-0"
                style={{ background: deck.colorPalette }}>
                {deck.words.length}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-extrabold text-sm text-dark capitalize truncate">{deck.sceneDesc}</p>
                <p className="font-body text-xs text-gray-400">{deck.words.length} words to practice</p>
              </div>
              <Mic className="w-4 h-4 text-amber-400 flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
