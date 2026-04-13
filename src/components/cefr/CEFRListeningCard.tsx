"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Volume2, Check, X } from "lucide-react";

interface CEFRListeningCardProps {
  audioText: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  onAnswer: (correct: boolean) => void;
  disabled?: boolean;
}

export function CEFRListeningCard({
  audioText,
  question,
  options,
  correctAnswer,
  onAnswer,
  disabled = false,
}: CEFRListeningCardProps) {
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "done">("idle");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (audioState === "loading" || audioState === "playing") return;

    setAudioState("loading");
    try {
      const res = await fetch("/api/cefr/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: audioText }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setAudioState("done");
        URL.revokeObjectURL(url);
      };

      setAudioState("playing");
      await audio.play();
    } catch {
      setAudioState("idle");
    }
  };

  const handleSelect = (answer: string) => {
    if (disabled || showResult) return;
    // Stop audio immediately when user picks an answer
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioState("done");
    setSelectedAnswer(answer);
    setShowResult(true);
    const isCorrect = answer === correctAnswer;
    onAnswer(isCorrect);
    setTimeout(() => {
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base bg-white p-6 space-y-5"
    >
      {/* Audio player */}
      <div className="flex flex-col items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handlePlay}
          disabled={audioState === "loading" || audioState === "playing"}
          className={`
            flex items-center gap-3 px-6 py-4 rounded-2xl font-body font-bold text-sm transition-all
            ${audioState === "idle"
              ? "bg-primary text-white shadow-md hover:bg-primary/90"
              : audioState === "loading"
              ? "bg-gray-100 text-gray-400 cursor-wait"
              : audioState === "playing"
              ? "bg-blue-50 text-blue-600 border-2 border-blue-200"
              : "bg-green-50 text-green-600 border-2 border-green-200"}
          `}
        >
          {audioState === "loading" ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          ) : audioState === "playing" ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Volume2 className="w-5 h-5" />
            </motion.div>
          ) : (
            <Play className="w-5 h-5" />
          )}
          {audioState === "idle" && "Play Audio"}
          {audioState === "loading" && "Loading..."}
          {audioState === "playing" && "Playing..."}
          {audioState === "done" && "Play Again"}
        </motion.button>

        {audioState === "idle" && (
          <p className="font-body text-xs text-gray-400">
            Press play to listen, then answer the question
          </p>
        )}
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
            <p className="font-body text-base font-semibold text-dark text-center">{question}</p>

            <div className="grid grid-cols-1 gap-2">
              {options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === correctAnswer;
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: showResult ? 1 : 0.98 }}
                    onClick={() => handleSelect(option)}
                    disabled={disabled || showResult}
                    className={`
                      relative rounded-xl px-4 py-3 font-body text-sm font-semibold border-2 transition-all
                      ${showResult && isSelected
                        ? isCorrect ? "bg-green-50 border-green-400 text-green-700"
                                    : "bg-red-50 border-red-400 text-red-700"
                        : showResult && isCorrect
                        ? "bg-green-50 border-green-400 text-green-700"
                        : "bg-white border-card-border text-dark hover:border-primary/50"}
                    `}
                  >
                    <span className={showResult && isSelected && !isCorrect ? "line-through opacity-60" : ""}>
                      {option}
                    </span>
                    {showResult && isSelected && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCorrect
                          ? <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                          : <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>
                        }
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
      </motion.div>
    </motion.div>
  );
}
