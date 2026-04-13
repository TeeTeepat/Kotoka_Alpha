"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import Image from "next/image";
import type { WordData, SkillResult, SessionState, PronunciationMetrics } from "@/types";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";

interface PronunciationSkillProps {
  words: WordData[];
  exercisePrompts: SessionState["exercisePrompts"];
  onComplete: (result: SkillResult) => void;
  onWrongAnswer?: () => void;
}

// Resample WebM blob → 16 kHz mono Int16 WAV → base64
async function blobToWavBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const TARGET_RATE = 16000;
  const numSamples = Math.round(audioBuffer.duration * TARGET_RATE);
  const offlineCtx = new OfflineAudioContext(1, numSamples, TARGET_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const resampled = await offlineCtx.startRendering();
  await audioCtx.close();

  const float32 = resampled.getChannelData(0);
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const dataSize = int16.length * 2;
  const wav = new ArrayBuffer(44 + dataSize);
  const v = new DataView(wav);
  const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, TARGET_RATE, true);
  v.setUint32(28, TARGET_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, dataSize, true);
  for (let i = 0; i < int16.length; i++) v.setInt16(44 + i * 2, int16[i], true);

  const bytes = new Uint8Array(wav);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function scoreColorClass(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

interface LetterTileHeatmapProps {
  text: string;
  words: Array<{ Word: string; Phonemes?: Array<{ PronunciationAssessment?: { AccuracyScore?: number } }> }> | null;
}

function LetterTileHeatmap({ text, words }: LetterTileHeatmapProps) {
  const wordScoreMap = new Map<string, number[]>();
  if (words) {
    for (const w of words) {
      const phonemes = (w.Phonemes ?? []).map((p) => p.PronunciationAssessment?.AccuracyScore ?? 0);
      wordScoreMap.set(w.Word.toLowerCase(), phonemes);
    }
  }

  const tokens = text.split(/(\s+)/);

  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
      {tokens.map((token, ti) => {
        if (/^\s+$/.test(token)) return <div key={ti} className="w-2" />;
        const letters = token.split("");
        const phonemes = wordScoreMap.get(token.toLowerCase());
        const M = phonemes?.length || 1;
        const N = letters.length;

        return (
          <div key={ti} className="flex gap-px">
            {letters.map((letter, li) => {
              let bg: string;
              if (!phonemes) {
                bg = "bg-gray-200 text-gray-500";
              } else {
                const phonemeIdx = Math.min(Math.floor((li * M) / N), M - 1);
                const score = phonemes[phonemeIdx] ?? 0;
                bg = score >= 80 ? "bg-emerald-400 text-white" : score >= 60 ? "bg-amber-400 text-white" : "bg-red-400 text-white";
              }
              return (
                <div
                  key={li}
                  title={phonemes ? `${Math.round(phonemes[Math.min(Math.floor((li * M) / N), M - 1)] ?? 0)}%` : undefined}
                  className={`${bg} rounded px-1.5 py-0.5 font-heading font-extrabold text-2xl leading-none transition-colors duration-300`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function syllabify(word: string): string[] {
  const vowels = /[aeiouáéíóú]/i;
  const letters = word.toLowerCase().split("");
  const syllables: string[] = [];
  let current = "";
  for (let i = 0; i < letters.length; i++) {
    current += letters[i];
    const isVowel = vowels.test(letters[i]);
    const nextCons = i + 1 < letters.length && !vowels.test(letters[i + 1]);
    const nextNextVowel = i + 2 < letters.length && vowels.test(letters[i + 2]);
    if (isVowel && nextCons && nextNextVowel && current.length >= 2) {
      syllables.push(current);
      current = "";
    }
  }
  if (current) syllables.push(current);
  return syllables.length ? syllables : [word];
}

export default function PronunciationSkill({ words, onComplete, onWrongAnswer }: PronunciationSkillProps) {
  const practiceWords = words.slice(0, 4);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [audioSubmitted, setAudioSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PronunciationMetrics | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const { play } = useSoundPlayer();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentWord = practiceWords[index];
  const syllables = currentWord ? syllabify(currentWord.word) : [];

  useEffect(() => {
    setMetrics(null);
    setError(null);
    setAudioSubmitted(false);
  }, [index]);

  // FIX 9d: TTS — speak the current word
  const speakWord = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = async () => {
    if (!currentWord) return;

    if (listening) {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state === "recording") mr.stop();
      return;
    }

    setListening(true);
    setError(null);
    setMetrics(null);
    setAudioSubmitted(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStartTime: number | null = null;
      const SILENCE_THRESHOLD = 30;
      const SILENCE_DURATION = 3000;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      const silenceCheckInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (average < SILENCE_THRESHOLD) {
          if (silenceStartTime === null) {
            silenceStartTime = Date.now();
          } else if (Date.now() - silenceStartTime > SILENCE_DURATION) {
            clearInterval(silenceCheckInterval);
            if (mediaRecorder.state === "recording") mediaRecorder.stop();
          }
        } else {
          silenceStartTime = null;
        }
      }, 100);

      mediaRecorder.onstop = async () => {
        clearInterval(silenceCheckInterval);
        await audioContext.close();
        setListening(false);
        setAudioSubmitted(true); // FIX 9c: show processing spinner

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const base64Audio = await blobToWavBase64(audioBlob);

          // FIX 9a: send only the word, not the example sentence
          const referenceText = currentWord.word;
          const response = await fetch("/api/pronunciation/assess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referenceText, audioData: base64Audio }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Assessment failed");
          }

          const result: PronunciationMetrics = await response.json();
          setMetrics(result);
          setAudioSubmitted(false);

          // FIX 5 + FIX 3: play sound and trigger heart deduction based on score
          const singleScore = Math.round((result.pronunciationScore + result.accuracyScore) / 2);
          if (singleScore >= 80) {
            play("correct");
          } else if (singleScore < 60) {
            play("wrong");
            onWrongAnswer?.();
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to assess pronunciation");
          setAudioSubmitted(false);
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access microphone");
      setListening(false);
    }
  };

  const handleNext = () => {
    const avgScore = metrics ? (metrics.accuracyScore + metrics.pronunciationScore) / 2 / 100 : 0;
    setSessionScores((prev) => [...prev, avgScore]);

    if (index + 1 >= practiceWords.length) {
      const allScores = [...sessionScores, avgScore];
      const avg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      onComplete({
        skill: "pronunciation",
        correct: Math.round(avg * practiceWords.length),
        total: practiceWords.length,
        vocabularyUsed: practiceWords.map((w) => w.word),
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleRedo = () => {
    setMetrics(null);
    setError(null);
    setAudioSubmitted(false);
  };

  const handleSkip = () => {
    setSessionScores((prev) => [...prev, 0]);
    if (index + 1 >= practiceWords.length) {
      const allScores = [...sessionScores, 0];
      const avg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      onComplete({
        skill: "pronunciation",
        correct: Math.round(avg * practiceWords.length),
        total: practiceWords.length,
        vocabularyUsed: practiceWords.map((w) => w.word),
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (practiceWords.length === 0) {
    onComplete({ skill: "pronunciation", correct: 0, total: 0, vocabularyUsed: [] });
    return null;
  }

  // FIX 9c: three mic button states
  const isProcessing = !listening && !metrics && audioSubmitted;

  // FIX 9b: single score (avg of pronunciation + accuracy)
  const singleScore = metrics ? Math.round((metrics.pronunciationScore + metrics.accuracyScore) / 2) : null;

  const showNextButton = singleScore !== null && singleScore >= 20;
  const showRedoButton = singleScore !== null && singleScore < 80;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-extrabold text-sm text-dark">Pronunciation</h3>
        <span className="text-xs font-body text-gray-400">{index + 1}/{practiceWords.length}</span>
      </div>

      <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary"
          animate={{ width: `${(index / practiceWords.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card-base p-6 flex flex-col items-center gap-5 relative overflow-hidden">
        {currentWord?.deckImage && (
          <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden rounded-t-card">
            <Image src={`data:image/jpeg;base64,${currentWord.deckImage}`} alt="Scene" fill className="object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
          </div>
        )}

        {/* FIX 9a+d: word-only heatmap with TTS button */}
        <div className={`flex flex-col items-center gap-3 w-full ${currentWord?.deckImage ? "mt-12" : ""}`}>
          <LetterTileHeatmap
            text={currentWord?.word || ""}
            words={metrics ? (metrics.detailedResult?.NBest?.[0]?.Words ?? metrics.detailedResult?.Words ?? null) : null}
          />
          <div className="flex items-center gap-2">
            <p className="font-body text-sm text-gray-400">{currentWord?.phonetic}</p>
            {/* FIX 9d: TTS speaker button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => speakWord(currentWord?.word ?? "")}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              title="Hear pronunciation"
            >
              <Volume2 className="w-3.5 h-3.5 text-gray-500" />
            </motion.button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          {syllables.map((syl, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-gray-100 font-body text-sm text-gray-600">{syl}</span>
          ))}
        </div>

        {error && (
          <div className="card-base p-4 text-center bg-red-50 border-red-200 w-full">
            <p className="font-body text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* FIX 9c: three-state mic button */}
        <motion.button
          whileHover={{ scale: isProcessing ? 1 : 1.06 }}
          whileTap={{ scale: isProcessing ? 1 : 0.94 }}
          onClick={isProcessing ? undefined : toggleMic}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all ${
            listening
              ? "bg-red-50 border-red-400"
              : isProcessing
              ? "bg-amber-50 border-amber-400"
              : "bg-primary/10 border-primary"
          }`}
        >
          {listening ? (
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <MicOff className="w-8 h-8 text-red-500" />
            </motion.div>
          ) : isProcessing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Loader2 className="w-8 h-8 text-amber-500" />
            </motion.div>
          ) : (
            <Mic className="w-8 h-8 text-primary" />
          )}
        </motion.button>

        {listening && (
          <p className="font-body text-sm text-red-500 animate-pulse text-center">
            Recording — tap again to stop &amp; submit
          </p>
        )}

        {isProcessing && (
          <p className="font-body text-sm text-amber-500 text-center">
            Processing…
          </p>
        )}

        {!metrics && !listening && !isProcessing && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSkip} className="text-xs font-body text-gray-400 hover:text-gray-600 underline">
            Skip this word
          </motion.button>
        )}

        {/* FIX 9b: single score display */}
        {metrics && singleScore !== null && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">
            <div className="flex flex-col items-center gap-1">
              <span className="font-body text-xs text-gray-400 uppercase tracking-wide">Score</span>
              <span className={`font-heading font-extrabold text-5xl ${scoreColorClass(singleScore)}`}>
                {singleScore}%
              </span>
            </div>

            <div className="flex gap-2">
              {showNextButton && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext} className="btn-aqua flex-1 py-3">
                  {index + 1 >= practiceWords.length ? "Finish" : "Next"}
                </motion.button>
              )}
              {showRedoButton && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleRedo} className="btn-gray flex-1 py-3">
                  Redo
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
