"use client";

// /daily — the 9-step Living Sandbox (FindWord) daily loop.
//
// Snap → Confirm (rigid, always first) → flexible steps in any order
// {Sensory Tags, Listen, Flashcard, Read/Write, Dictation} → Pronunciation
// → Second Take (checkpoint, reachable at any time) → Peak A → done → Peak B.
// No score is ever shown inside the loop.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  ImageIcon,
  Loader2,
  Mic,
  Play,
  Square,
  Volume2,
  X,
} from "lucide-react";
import PathPicker from "@/components/daily/PathPicker";
import PeakA from "@/components/daily/PeakA";
import PeakB from "@/components/daily/PeakB";
import WorldListeningCue from "@/components/daily/WorldListeningCue";
import type { FlexibleStepId, GateId, AgeBand } from "@/components/daily/gates";
import {
  listenReplaysForBand,
  readWriteTaskForBand,
  sizingForBand,
  normalizeBand,
} from "@/lib/srs/fixedSchedule";
import { SENSORY_SIZES, TEXTURES } from "@/lib/compositing";

/* ────────────────────────────── types ────────────────────────────── */

interface SessionWord {
  id: string;
  word: string;
  translation: string;
  becauseText: string | null;
  photoUrl: string | null;
  isReview: boolean;
}

interface NeighbourWord {
  word: string;
  thai: string;
  because: string;
}

type Phase =
  | "loading"
  | "snap"
  | "identifying"
  | "confirm"
  | "seeding"
  | "path"
  | "flex"
  | "pronunciation"
  | "cue"
  | "second_take"
  | "peak_a"
  | "wrap"
  | "peak_b";

const ALL_FLEX_STEPS: FlexibleStepId[] = [
  "sensory_tags",
  "listen",
  "flashcard",
  "read_write",
  "dictation",
];

const STEP_LABEL: Record<FlexibleStepId, string> = {
  sensory_tags: "Sensory tags",
  listen: "Listen",
  flashcard: "Flashcards",
  read_write: "Read & write",
  dictation: "Dictation",
};

/* ───────────────────────────── helpers ───────────────────────────── */

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function compressToThumb(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      const maxW = 400;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Simple record/playback hook — no analysis, no grading. */
function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setUnsupported(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setUnsupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }, [audioUrl]);

  return { recording, audioUrl, unsupported, start, stop, reset };
}

/* ─────────────────────────── flex steps ──────────────────────────── */

function ListenStep({
  words,
  replays,
  onDone,
}: {
  words: SessionWord[];
  replays: number;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const current = words[index];

  useEffect(() => {
    if (!current) return;
    speak(current.word);
    const perWord = replays + 1;
    const t = setTimeout(() => {
      if (playCount + 1 < perWord) {
        setPlayCount((c) => c + 1);
      } else if (index + 1 < words.length) {
        setIndex((i) => i + 1);
        setPlayCount(0);
      } else {
        onDone();
      }
    }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playCount]);

  if (!current) return null;
  return (
    <div className="card-base p-6 flex flex-col items-center gap-4">
      <motion.div
        key={`${index}-${playCount}`}
        initial={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Volume2 className="w-9 h-9 text-primary" />
      </motion.div>
      <p className="font-heading font-extrabold text-2xl text-dark">{current.word}</p>
      <p className="font-body text-sm text-gray-400">{current.translation}</p>
      <p className="font-body text-xs text-gray-300">
        {index + 1} / {words.length}
      </p>
    </div>
  );
}

function FlashcardStep({
  words,
  onDone,
}: {
  words: SessionWord[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = words[index];

  const report = (gotIt: boolean) => {
    if (!current) return;
    fetch("/api/daily/selfreport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.id, gotIt }),
    }).catch(() => {});
    if (index + 1 < words.length) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      onDone();
    }
  };

  if (!current) return null;
  return (
    <div className="flex flex-col items-center gap-5">
      <motion.button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        whileTap={{ scale: 0.97 }}
        className="card-base w-full max-w-sm aspect-[4/3] flex flex-col items-center justify-center gap-3 p-6"
      >
        {!flipped ? (
          <>
            {current.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.photoUrl}
                alt=""
                className="w-24 h-24 rounded-2xl object-cover"
              />
            ) : (
              <span className="text-5xl">🃏</span>
            )}
            <p className="font-heading font-extrabold text-2xl text-dark">
              {current.word}
            </p>
            <p className="font-body text-xs text-gray-400">tap to flip</p>
          </>
        ) : (
          <>
            <p className="font-heading font-extrabold text-xl text-dark">
              {current.translation}
            </p>
            {current.becauseText && (
              <p className="font-body text-sm text-gray-500 text-center">
                {current.becauseText}
              </p>
            )}
          </>
        )}
      </motion.button>

      <div className="flex gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={() => report(false)}
          className="flex-1 py-3 rounded-2xl bg-gray-100 font-heading font-bold text-sm text-gray-500"
        >
          Still learning
        </button>
        <button
          type="button"
          onClick={() => report(true)}
          className="flex-1 py-3 rounded-2xl bg-primary font-heading font-bold text-sm text-white"
        >
          Got it
        </button>
      </div>
      <p className="font-body text-xs text-gray-300">
        {index + 1} / {words.length}
      </p>
    </div>
  );
}

const TEXTURE_EMOJI: Record<string, string> = {
  furry: "🐻",
  scaly: "🐍",
  smooth: "🥚",
  rough: "🪨",
  soft: "☁️",
  hard: "🧱",
  warm: "🔥",
  cold: "🧊",
};

function SensoryStep({
  word,
  onDone,
}: {
  word: SessionWord;
  onDone: () => void;
}) {
  const [size, setSize] = useState<string | null>(null);
  const [textures, setTextures] = useState<string[]>([]);

  const iconCount = (size ? 1 : 0) + textures.length;

  const toggleTexture = (t: string) => {
    setTextures((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : iconCount < 8
          ? [...prev, t]
          : prev
    );
  };

  const save = () => {
    fetch("/api/daily/sensory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, size, textures }),
    }).catch(() => {});
    onDone();
  };

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <p className="font-heading font-extrabold text-lg text-dark text-center">
        How does the {word.word} feel?
      </p>
      <div className="flex justify-center gap-3">
        {SENSORY_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize((cur) => (cur === s ? null : s))}
            className={`px-4 py-2 rounded-2xl font-heading font-bold text-sm capitalize border-2 transition-colors ${
              size === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-100 text-gray-400"
            }`}
          >
            {s === "small" ? "🐁" : s === "medium" ? "🐕" : "🐘"} {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TEXTURES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggleTexture(t)}
            className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-colors ${
              textures.includes(t)
                ? "border-primary bg-primary/10"
                : "border-gray-100"
            }`}
          >
            <span className="text-xl">{TEXTURE_EMOJI[t]}</span>
            <span className="font-body text-[10px] text-gray-500 capitalize">{t}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        className="btn-aqua w-full py-3 justify-center"
      >
        <Check className="w-4 h-4" /> Keep these
      </button>
    </div>
  );
}

function ReadWriteStep({
  word,
  ageBand,
  onDone,
}: {
  word: SessionWord;
  ageBand: AgeBand;
  onDone: () => void;
}) {
  const task = readWriteTaskForBand(ageBand);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const model =
    word.becauseText && word.becauseText.trim()
      ? word.becauseText
      : `I found a ${word.word} today.`;
  const cloze = model.toLowerCase().includes(word.word.toLowerCase())
    ? model.replace(new RegExp(word.word, "i"), "_____")
    : `I found a _____ today.`;

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      {task === "cloze" ? (
        <>
          <p className="font-heading font-extrabold text-lg text-dark">
            Fill in the missing word
          </p>
          <p className="font-body text-base text-gray-600">{cloze}</p>
        </>
      ) : (
        <>
          <p className="font-heading font-extrabold text-lg text-dark">
            Write a sentence with “{word.word}”
          </p>
          <p className="font-body text-xs text-gray-400">
            Any sentence you like — there is no wrong answer.
          </p>
        </>
      )}

      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={submitted}
        placeholder={task === "cloze" ? word.translation : "Your sentence…"}
        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 font-body text-sm focus:border-primary focus:outline-none"
      />

      {!submitted ? (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={!answer.trim()}
          className="btn-aqua w-full py-3 justify-center disabled:opacity-40"
        >
          Show me a sentence
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="rounded-2xl bg-primary/5 p-4">
            <p className="font-body text-xs text-gray-400 mb-1">
              One way to say it:
            </p>
            <p className="font-body text-sm text-dark">{model}</p>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="btn-aqua w-full py-3 justify-center"
          >
            <Check className="w-4 h-4" /> Onward
          </button>
        </motion.div>
      )}
    </div>
  );
}

function DictationStep({
  words,
  onDone,
}: {
  words: SessionWord[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const current = words[index];

  useEffect(() => {
    if (current) speak(current.word);
  }, [index, current]);

  const next = () => {
    if (index + 1 < words.length) {
      setIndex((i) => i + 1);
      setTyped("");
      setRevealed(false);
    } else {
      onDone();
    }
  };

  if (!current) return null;
  const matches = typed.trim().toLowerCase() === current.word.toLowerCase();

  return (
    <div className="card-base p-5 flex flex-col gap-4">
      <p className="font-heading font-extrabold text-lg text-dark text-center">
        Type what you hear
      </p>
      <button
        type="button"
        onClick={() => speak(current.word)}
        className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Volume2 className="w-7 h-7 text-primary" />
      </button>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        disabled={revealed}
        placeholder="…"
        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 font-body text-sm text-center focus:border-primary focus:outline-none"
      />
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          disabled={!typed.trim()}
          className="btn-aqua w-full py-3 justify-center disabled:opacity-40"
        >
          Check
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <p className="font-body text-sm text-center text-gray-500">
            {matches
              ? `Yes — “${current.word}”.`
              : `It was “${current.word}” — nice listening anyway.`}
          </p>
          <button
            type="button"
            onClick={next}
            className="btn-aqua w-full py-3 justify-center"
          >
            {index + 1 < words.length ? "Next" : "Done"}
          </button>
        </motion.div>
      )}
      <p className="font-body text-xs text-gray-300 text-center">
        {index + 1} / {words.length}
      </p>
    </div>
  );
}

function RecordingStep({
  title,
  prompt,
  buttonLabel,
  onContinue,
}: {
  title: string;
  prompt: string;
  buttonLabel: string;
  onContinue: () => void;
}) {
  const { recording, audioUrl, unsupported, start, stop } = useRecorder();
  const [playedBack, setPlayedBack] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <div className="card-base p-6 flex flex-col items-center gap-4">
      <p className="font-heading font-extrabold text-lg text-dark text-center">
        {title}
      </p>
      <p className="font-body text-sm text-gray-500 text-center">{prompt}</p>

      {!unsupported ? (
        <button
          type="button"
          onClick={recording ? stop : start}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-card transition-colors ${
            recording ? "bg-red-500" : "bg-primary"
          }`}
        >
          {recording ? (
            <Square className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>
      ) : (
        <p className="font-body text-xs text-gray-400 text-center">
          No microphone here — say it out loud anyway, then continue.
        </p>
      )}

      {audioUrl && (
        <>
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlayedBack(true)} />
          {!playedBack && (
            <button
              type="button"
              onClick={() => audioRef.current?.play()}
              className="flex items-center gap-2 font-body text-sm text-primary"
            >
              <Play className="w-4 h-4" /> Hear yourself (once)
            </button>
          )}
        </>
      )}

      {(audioUrl || unsupported) && !recording && (
        <button
          type="button"
          onClick={onContinue}
          className="btn-aqua w-full py-3 justify-center"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── page shell ──────────────────────────── */

export default function DailyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [ageBand, setAgeBand] = useState<AgeBand>("11-15");
  const [error, setError] = useState<string | null>(null);

  // Snap / Confirm state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [alternates, setAlternates] = useState<string[]>([]);
  const [neighbourWords, setNeighbourWords] = useState<NeighbourWord[]>([]);
  const [showAlternates, setShowAlternates] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

  // Session word set
  const [words, setWords] = useState<SessionWord[]>([]);
  const [seedWordId, setSeedWordId] = useState<string | null>(null);

  // Flexible-step machine
  const [flexQueue, setFlexQueue] = useState<FlexibleStepId[]>(ALL_FLEX_STEPS);
  const [stepsDone, setStepsDone] = useState(0);

  const dayWord = words.find((w) => w.id === seedWordId) ?? words[0] ?? null;
  const { N } = sizingForBand(ageBand);
  const cycleWords = words.slice(0, N);
  const totalSteps = 2 + ALL_FLEX_STEPS.length + 2; // snap+confirm, flex, pron+2nd take

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (cancelled) return;
        setAgeBand(normalizeBand(u?.ageBand, u?.age));
        setPhase("snap");
      })
      .catch(() => {
        if (!cancelled) setPhase("snap");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Snap ── */
  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoDataUrl(dataUrl);
      setPhase("identifying");
      setError(null);
      try {
        const res = await fetch("/api/snap/neighbours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: dataUrl.split(",")[1] }),
        });
        if (!res.ok) throw new Error("identify failed");
        const data = await res.json();
        setLabel(data.label);
        setAlternates(data.alternates ?? []);
        setNeighbourWords(data.words ?? []);
        setPhase("confirm");
      } catch {
        setError("Couldn't see the object clearly — try another photo.");
        setPhotoDataUrl(null);
        setPhase("snap");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  /* ── Confirm ── */
  const regenerateFor = useCallback(async (newLabel: string) => {
    setPhase("identifying");
    setError(null);
    try {
      const res = await fetch("/api/snap/neighbours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel }),
      });
      if (!res.ok) throw new Error("neighbours failed");
      const data = await res.json();
      setLabel(data.label);
      setNeighbourWords(data.words ?? []);
      setShowAlternates(false);
      setPhase("confirm");
    } catch {
      setError("Hmm, that word tangled — try once more.");
      setPhase("confirm");
    }
  }, []);

  const confirmLabel = useCallback(async () => {
    if (!label) return;
    setPhase("seeding");
    setError(null);
    try {
      const photoThumb = photoDataUrl ? await compressToThumb(photoDataUrl) : null;
      const [seedRes, reviewRes] = await Promise.all([
        fetch("/api/daily/seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, words: neighbourWords, photoThumb }),
        }),
        fetch("/api/daily/review-queue"),
      ]);
      if (!seedRes.ok) throw new Error("seed failed");
      const seed = await seedRes.json();
      const review = reviewRes.ok ? await reviewRes.json() : { words: [] };

      const fresh: SessionWord[] = (seed.words ?? []).map(
        (w: {
          id: string;
          word: string;
          translation: string;
          becauseText: string | null;
          photoUrl: string | null;
        }) => ({ ...w, isReview: false })
      );
      const reviews: SessionWord[] = (review.words ?? []).map(
        (w: {
          id: string;
          word: string;
          translation: string;
          becauseText: string | null;
          photoUrl: string | null;
        }) => ({ ...w, isReview: true })
      );
      setWords([...fresh, ...reviews]);
      setSeedWordId(seed.seedWordId);
      setStepsDone(2);
      setPhase("path");
    } catch {
      setError("Couldn't save today's words — check your connection.");
      setPhase("confirm");
    }
  }, [label, neighbourWords, photoDataUrl]);

  /* ── Flexible steps ── */
  const finishFlexStep = useCallback(() => {
    setFlexQueue((q) => q.slice(1));
    setStepsDone((d) => d + 1);
  }, []);

  useEffect(() => {
    if (phase === "flex" && flexQueue.length === 0) {
      setPhase("pronunciation");
    }
  }, [phase, flexQueue]);

  const gotoCheckpoint = useCallback(() => {
    setPhase("pronunciation");
  }, []);

  /* ── Checkpoint ── */
  const completeCheckpoint = useCallback(() => {
    // Deterministic: fires on completion of the Second Take itself,
    // never on how it sounded. Sets the overnight Peak B pending flag
    // server-side in case the app closes before "done for today".
    fetch("/api/daily/checkpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: seedWordId,
        sentenceText: dayWord ? `I found a ${dayWord.word} today.` : null,
      }),
    }).catch(() => {});
    setStepsDone(totalSteps);
    setPhase("peak_a");
  }, [seedWordId, dayWord, totalSteps]);

  const doneForToday = useCallback(() => {
    fetch("/api/daily/done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: seedWordId }),
    }).catch(() => {});
    setPhase("peak_b");
  }, [seedWordId]);

  /* ── render ── */
  const currentStep = flexQueue[0];
  const progress = Math.min(100, Math.round((stepsDone / totalSteps) * 100));

  return (
    <div className="py-4 space-y-5">
      {/* Session progress — position only, never a score */}
      {phase !== "loading" && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      {error && (
        <div className="card-base p-4 border-red-200 bg-red-50/50">
          <p className="font-body text-sm text-red-600">{error}</p>
        </div>
      )}

      {phase === "loading" && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* 1 — Snap */}
      {phase === "snap" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-6 flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-9 h-9 text-primary" />
          </div>
          <p className="font-heading font-extrabold text-lg text-dark text-center">
            Find one thing today
          </p>
          <p className="font-body text-sm text-gray-500 text-center">
            Snap the object that caught your eye. One photo seeds your whole day.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-aqua w-full py-3 justify-center"
          >
            <ImageIcon className="w-4 h-4" /> Snap it
          </button>
        </motion.div>
      )}

      {phase === "identifying" && (
        <div className="card-base p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-body text-sm text-gray-500">Looking closely…</p>
        </div>
      )}

      {/* 2 — Confirm */}
      {phase === "confirm" && label && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base overflow-hidden"
        >
          {photoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoDataUrl}
              alt="your find"
              className="w-full aspect-[4/3] object-cover"
            />
          )}
          <div className="p-5 flex flex-col gap-4">
            <p className="font-heading font-extrabold text-lg text-dark text-center">
              Is it a <span className="text-primary">{label}</span>?
            </p>
            {!showAlternates ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAlternates(true)}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 font-heading font-bold text-sm text-gray-500 flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> No
                </button>
                <button
                  type="button"
                  onClick={confirmLabel}
                  className="flex-1 py-3 rounded-2xl bg-primary font-heading font-bold text-sm text-white flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Yes!
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {alternates.map((alt) => (
                  <button
                    key={alt}
                    type="button"
                    onClick={() => regenerateFor(alt)}
                    className="w-full py-3 rounded-2xl bg-gray-50 font-heading font-bold text-sm text-dark"
                  >
                    It's a {alt}
                  </button>
                ))}
                <div className="flex gap-2 mt-1">
                  <input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Type what it really is…"
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-100 font-body text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => customLabel.trim() && regenerateFor(customLabel.trim())}
                    disabled={!customLabel.trim()}
                    className="px-4 rounded-2xl bg-primary text-white font-heading font-bold text-sm disabled:opacity-40"
                  >
                    Go
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {phase === "seeding" && (
        <div className="card-base p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-body text-sm text-gray-500">
            Gathering words around your {label}…
          </p>
        </div>
      )}

      {/* 3 — Path Picker (starting routes only, always skippable) */}
      {phase === "path" && (
        <PathPicker
          ageBand={ageBand}
          wordId={seedWordId}
          flexibleQueue={flexQueue}
          onChosen={(_gate: GateId, ordered: FlexibleStepId[]) => {
            setFlexQueue(ordered);
            setPhase("flex");
          }}
          onSkip={() => setPhase("flex")}
        />
      )}

      {/* 4 — Flexible steps */}
      {phase === "flex" && currentStep && dayWord && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-heading font-extrabold text-base text-dark">
              {STEP_LABEL[currentStep]}
            </p>
            <button
              type="button"
              onClick={finishFlexStep}
              className="font-body text-xs text-gray-400 underline underline-offset-4 decoration-dotted"
            >
              skip this
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {currentStep === "listen" && (
                <ListenStep
                  words={cycleWords}
                  replays={listenReplaysForBand(ageBand)}
                  onDone={finishFlexStep}
                />
              )}
              {currentStep === "flashcard" && (
                <FlashcardStep words={cycleWords} onDone={finishFlexStep} />
              )}
              {currentStep === "sensory_tags" && (
                <SensoryStep word={dayWord} onDone={finishFlexStep} />
              )}
              {currentStep === "read_write" && (
                <ReadWriteStep
                  word={dayWord}
                  ageBand={ageBand}
                  onDone={finishFlexStep}
                />
              )}
              {currentStep === "dictation" && (
                <DictationStep words={cycleWords} onDone={finishFlexStep} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Checkpoint is reachable at any time */}
          <button
            type="button"
            onClick={gotoCheckpoint}
            className="w-full py-2 font-body text-xs text-gray-400 underline underline-offset-4 decoration-dotted"
          >
            head to the clearing (finish today)
          </button>
        </div>
      )}

      {/* 5 — Pronunciation (always right before Second Take) */}
      {phase === "pronunciation" && dayWord && (
        <RecordingStep
          title={`Say “${dayWord.word}”`}
          prompt="Record yourself saying today's word, then hear it back once. Nothing is graded — just you and the word."
          buttonLabel="Ready for the last step"
          onContinue={() => setPhase("cue")}
        />
      )}

      {/* 6 — the identical pre-checkpoint cue */}
      {phase === "cue" && <WorldListeningCue onDone={() => setPhase("second_take")} />}

      {/* 7 — Second Take (checkpoint) */}
      {phase === "second_take" && dayWord && (
        <RecordingStep
          title="Second Take"
          prompt={`Say a whole sentence with “${dayWord.word}”. The world is listening.`}
          buttonLabel="That was my take"
          onContinue={completeCheckpoint}
        />
      )}

      {/* 8 — Peak A: deterministic on checkpoint completion */}
      {phase === "peak_a" && (
        <PeakA
          photoUrl={photoDataUrl ?? dayWord?.photoUrl ?? null}
          word={dayWord?.word ?? null}
          onDone={() => setPhase("wrap")}
        />
      )}

      {/* wrap — done for today */}
      {phase === "wrap" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-6 flex flex-col items-center gap-4"
        >
          <p className="font-heading font-extrabold text-lg text-dark text-center">
            That's everything for today.
          </p>
          <p className="font-body text-sm text-gray-500 text-center">
            Your {dayWord?.word ?? "find"} is ready to settle into your world.
          </p>
          <button
            type="button"
            onClick={doneForToday}
            className="btn-aqua w-full py-3 justify-center"
          >
            Done for today
          </button>
        </motion.div>
      )}

      {/* 9 — Peak B: the settle */}
      {phase === "peak_b" && (
        <PeakB
          photoUrl={photoDataUrl ?? dayWord?.photoUrl ?? null}
          word={dayWord?.word ?? null}
          variant="done"
          onDone={() => router.push("/")}
        />
      )}
    </div>
  );
}
