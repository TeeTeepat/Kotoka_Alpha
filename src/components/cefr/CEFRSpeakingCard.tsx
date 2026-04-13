"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Check, X, AlertCircle } from "lucide-react";

interface CEFRSpeakingCardProps {
  prompt: string;
  keywords: string[];
  exampleAnswer: string;
  onAnswer: (correct: boolean, transcript: string) => void;
  disabled?: boolean;
}

type RecordState = "idle" | "requesting" | "recording" | "processing" | "done" | "denied";

export function CEFRSpeakingCard({
  prompt,
  keywords,
  exampleAnswer,
  onAnswer,
  disabled = false,
}: CEFRSpeakingCardProps) {
  const [state, setState] = useState<RecordState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExample, setShowExample] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleRecord = async () => {
    if (disabled || state === "done") return;

    if (state === "recording") {
      // Stop recording
      mediaRecorderRef.current?.stop();
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setState("recording");
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("processing");

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");

          const res = await fetch("/api/cefr/stt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioData: base64 }),
          });

          if (!res.ok) throw new Error("STT failed");
          const { transcript: text } = await res.json();

          const lower = (text ?? "").toLowerCase();
          const matched = keywords.some((kw) => lower.includes(kw.toLowerCase()));

          setTranscript(text || "(no speech detected)");
          setIsCorrect(matched);
          setState("done");
          onAnswer(matched, text ?? "");
        } catch {
          setTranscript("(could not transcribe)");
          setIsCorrect(false);
          setState("done");
          onAnswer(false, "");
        }
      };

      recorder.start();
    } catch {
      setState("denied");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base bg-white p-6 space-y-5"
    >
      {/* Prompt */}
      <div className="bg-primary/5 rounded-2xl px-4 py-4">
        <p className="font-body text-base text-dark leading-relaxed text-center">{prompt}</p>
      </div>

      {/* Mic permission denied */}
      {state === "denied" && (
        <div className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="font-body text-sm text-red-600">
            Microphone access denied. Please allow mic access in your browser settings.
          </p>
        </div>
      )}

      {/* Record button */}
      {state !== "done" && state !== "denied" && (
        <div className="flex flex-col items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRecord}
            disabled={disabled || state === "requesting" || state === "processing"}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg
              ${state === "recording"
                ? "bg-red-500 hover:bg-red-600"
                : state === "processing" || state === "requesting"
                ? "bg-gray-200 cursor-wait"
                : "bg-primary hover:bg-primary/90"}
            `}
          >
            {state === "processing" || state === "requesting" ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-primary rounded-full animate-spin" />
            ) : state === "recording" ? (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                <MicOff className="w-8 h-8 text-white" />
              </motion.div>
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </motion.button>

          <p className="font-body text-xs text-gray-400 text-center">
            {state === "idle" && "Tap to start recording"}
            {state === "requesting" && "Requesting microphone..."}
            {state === "recording" && "Recording — tap to stop"}
            {state === "processing" && "Processing your answer..."}
          </p>

          {state === "recording" && (
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-red-400 rounded-full"
                  animate={{ height: [8, 20, 8] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {state === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${isCorrect ? "bg-green-50" : "bg-orange-50"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? "bg-green-500" : "bg-orange-400"}`}>
                {isCorrect ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className={`font-body font-bold text-sm ${isCorrect ? "text-green-700" : "text-orange-700"}`}>
                  {isCorrect ? "Great answer!" : "Keep practicing!"}
                </p>
                <p className="font-body text-xs text-gray-500 mt-1 italic">
                  You said: "{transcript}"
                </p>
              </div>
            </div>

            {!isCorrect && (
              <button
                onClick={() => setShowExample((s) => !s)}
                className="font-body text-xs text-primary hover:underline"
              >
                {showExample ? "Hide" : "Show"} example answer
              </button>
            )}
            <AnimatePresence>
              {showExample && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-xl px-4 py-3"
                >
                  <p className="font-body text-xs text-gray-600 italic">"{exampleAnswer}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
