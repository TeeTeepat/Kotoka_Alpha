"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SessionState, SkillType, SkillResult, WordData, QuestionResult } from "@/types";
import {
  createSessionState,
  advanceQuestion,
  isSessionComplete,
  saveSessionToStorage,
  clearSessionStorage,
  calculateCoinsEarned,
} from "@/lib/session/clientStateManager";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import SessionProgressBar from "./SessionProgressBar";
import FlashcardsSkill from "./skills/FlashcardsSkill";
import ConversationSkill from "./skills/ConversationSkill";
import DictationSkill from "./skills/DictationSkill";
import PronunciationSkill from "./skills/PronunciationSkill";
import FillBlankSkill from "./skills/FillBlankSkill";

interface SessionContainerProps {
  sessionId: string;
  words: WordData[];
  exercisePrompts: SessionState["exercisePrompts"];
  existingState?: SessionState | null;
  streak: number;
  hearts?: number;
  onComplete: (results: SkillResult[], coinsEarned: number, completedQuestions: QuestionResult[]) => Promise<void>;
  onExit: () => void;
}

/** Map skill result to SM-2 quality (0-5) */
function mapQuality(skill: SkillType, result: SkillResult): number {
  if (result.quality !== undefined) return result.quality;
  switch (skill) {
    case "flashcards":    return result.correct >= 1 ? 4 : 1;
    case "dictation":     return result.correct >= 1 ? 4 : 1;
    case "fill-blank":    return result.correct >= 1 ? 4 : 1;
    case "conversation":  return result.correct >= 1 ? 3 : 1;
    case "pronunciation": return result.correct >= 1 ? 4 : 1;
    default:              return result.correct >= 1 ? 4 : 1;
  }
}

export default function SessionContainer({
  sessionId,
  words,
  exercisePrompts,
  existingState,
  streak,
  hearts = 5,
  onComplete,
  onExit,
}: SessionContainerProps) {
  const { play } = useSoundPlayer();
  const [sessionState, setSessionState] = useState<SessionState>(
    existingState ?? createSessionState(sessionId, sessionId, words, exercisePrompts)
  );
  const [completing, setCompleting] = useState(false);
  const [heartsEmpty, setHeartsEmpty] = useState(false);
  const [nextHeartAt, setNextHeartAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    saveSessionToStorage(sessionState);
  }, [sessionState]);

  const currentQuestion = sessionState.questionQueue[sessionState.currentQuestionIndex] ?? null;

  const handleSkillComplete = useCallback(
    (result: SkillResult) => {
      if (!currentQuestion) return;
      const quality = mapQuality(currentQuestion.skill, result);
      setSessionState((prev) => advanceQuestion(prev, quality));
    },
    [currentQuestion]
  );

  const handleWrongAnswer = useCallback(async () => {
    try {
      const res = await fetch("/api/user/hearts", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        play("heart-break");
        if (data.hearts === 0) {
          setHeartsEmpty(true);
          setNextHeartAt(data.nextHeartAt ?? null);
        }
      }
    } catch { /* silent */ }
  }, [play]);

  // Live countdown when hearts = 0
  useEffect(() => {
    if (!heartsEmpty || !nextHeartAt) { setCountdown(""); return; }

    function tick() {
      const diff = new Date(nextHeartAt!).getTime() - Date.now();
      if (diff <= 0) {
        fetch("/api/user/hearts")
          .then(r => r.json())
          .then(data => {
            if (data.hearts > 0) setHeartsEmpty(false);
            setNextHeartAt(data.nextHeartAt ?? null);
          })
          .catch(() => {});
        setCountdown("00:00");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [heartsEmpty, nextHeartAt]);

  // Auto-complete when all questions done
  useEffect(() => {
    if (!isSessionComplete(sessionState) || completing) return;

    const finish = async () => {
      setCompleting(true);
      play("fanfare");
      const coins = calculateCoinsEarned(sessionState.skillResults, streak);
      try {
        await onComplete(sessionState.skillResults, coins, sessionState.completedQuestions);
      } catch (err) {
        console.error("[Session] Complete failed:", err);
      }
      clearSessionStorage();
    };
    finish();
  }, [sessionState, completing, streak, onComplete, play]);

  const renderCurrentSkill = () => {
    if (!currentQuestion) return null;
    const { word, skill, attemptNumber } = currentQuestion;
    const singleWordArr = [word];

    const commonProps = {
      words: singleWordArr,
      exercisePrompts,
      onComplete: handleSkillComplete,
      onWrongAnswer: handleWrongAnswer,
    };

    // Key includes attemptNumber so component remounts on retry with same word
    switch (skill) {
      case "flashcards":
        return <FlashcardsSkill key={`fc-${word.id}-${attemptNumber}`} {...commonProps} />;
      case "conversation":
        return <ConversationSkill key={`cv-${word.id}-${attemptNumber}`} {...commonProps} />;
      case "dictation":
        return <DictationSkill key={`dt-${word.id}-${attemptNumber}`} {...commonProps} />;
      case "pronunciation":
        return <PronunciationSkill key={`pr-${word.id}-${attemptNumber}`} {...commonProps} />;
      case "fill-blank":
        return (
          <FillBlankSkill
            key={`fb-${word.id}-${attemptNumber}`}
            word={word}
            words={words}
            onComplete={handleSkillComplete}
            onWrongAnswer={handleWrongAnswer}
          />
        );
    }
  };

  const questionsTotal = sessionState.questionQueue.length;
  const questionsDone = sessionState.currentQuestionIndex;

  return (
    <div className="py-4 space-y-5">
      {currentQuestion && (
        <SessionProgressBar
          questionsDone={questionsDone}
          questionsTotal={questionsTotal}
          currentSkill={currentQuestion.skill}
        />
      )}

      {/* Hearts warning */}
      <AnimatePresence>
        {heartsEmpty && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2"
          >
            <span className="text-base">💔</span>
            <p className="font-body text-xs text-red-600 flex-1">
              Hearts empty — next heart in{" "}
              <span className="font-bold tabular-nums">{countdown || "…"}</span>
            </p>
            <button
              onClick={() => setHeartsEmpty(false)}
              className="font-body text-xs text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion ? `${currentQuestion.word.id}-${currentQuestion.skill}-${currentQuestion.attemptNumber}` : "done"}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          {renderCurrentSkill()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
