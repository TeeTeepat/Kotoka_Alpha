"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Flame, Trophy, X } from "lucide-react";
import { fillBlankQuestions, type FillBlankQuestion } from "@/lib/mockData";
import { FillBlankQuestion as FillBlankQuestionComponent } from "@/components/fillBlank/FillBlankQuestion";
import { HeartsDisplay } from "@/components/fillBlank/HeartsDisplay";
import { AnswerFeedback } from "@/components/fillBlank/AnswerFeedback";
import { ModeToggle } from "@/components/fillBlank/ModeToggle";
import { ParticleEffect } from "@/components/ParticleEffect";
import { mascotVariants, type MascotState } from "@/components/animations/mascotVariants";
import KokoMascot from "@/components/KokoMascot";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { useLocale } from "@/lib/i18n";

type GameMode = "beginner" | "advanced";

export default function FillInBlankPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { play } = useSoundPlayer();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mode, setMode] = useState<GameMode>("beginner");
  const [usedHints, setUsedHints] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [triggerStreak, setTriggerStreak] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);

  const [questions, setQuestions] = useState(fillBlankQuestions);
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  useEffect(() => {
    fetch("/api/fill-blank/generate?count=10")
      .then(r => r.json())
      .then(data => {
        if (data.questions?.length > 0) {
          // Map API questions to local format
          const mapped = data.questions.map((q: { id: string; sentence_with_blank: string; correct_answer: string; options?: string[]; hint?: string }) => ({
            id: q.id,
            sentenceWithBlank: q.sentence_with_blank,
            correctAnswer: q.correct_answer,
            options: (q.options ?? [q.correct_answer, "option2", "option3", "option4"]) as [string, string, string, string],
            hint: q.hint ?? "",
            difficulty: "beginner" as const,
          }));
          setQuestions(mapped);
        }
      })
      .catch(() => {/* keep mock data */});
  }, []);

  useEffect(() => {
    if (hearts < 3) {
      setMascotState("encouraging");
    } else if (streak >= 3) {
      setMascotState("excited");
    } else {
      setMascotState("idle");
    }
  }, [hearts, streak]);

  const handleAnswer = (correct: boolean) => {
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      const newScore = score + 10 + streak * 2;
      setScore(newScore);
      setStreak(streak + 1);

      if (streak + 1 >= 3) {
        setTriggerStreak(true);
        setTimeout(() => setTriggerStreak(false), 1000);
      }

      if (currentQuestionIndex === totalQuestions - 1) {
        setTimeout(() => {
          setTriggerConfetti(true);
          setRoundComplete(true);
          play("fanfare");
        }, 1500);
      } else {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
          setShowFeedback(false);
        }, 1500);
      }
    } else {
      setHearts((prev) => {
        const newHearts = prev - 1;
        if (newHearts === 0) {
          setTimeout(() => {
            setGameOver(true);
            play("wrong");
          }, 1500);
        }
        return newHearts;
      });
      setStreak(0);

      if (hearts > 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
          setShowFeedback(false);
        }, 1500);
      }
    }
  };

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    setUsedHints(0);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setHearts(5);
    setScore(0);
    setStreak(0);
    setUsedHints(0);
    setShowFeedback(false);
    setIsCorrect(null);
    setGameOver(false);
    setRoundComplete(false);
    setTriggerConfetti(false);
    setMascotState("idle");
  };

  const handleBackHome = () => {
    router.push("/review");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <ParticleEffect type="confetti" trigger={triggerConfetti} position="center" />
      <ParticleEffect type="streak" trigger={triggerStreak} position="top" />

      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-card-border">
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-gray-500 hover:text-dark transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-body text-sm">{t.back}</span>
            </button>
            <h1 className="font-heading font-extrabold text-lg text-dark">{t.fillBlankTitle}</h1>
            <div className="w-16" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HeartsDisplay hearts={hearts} />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-card-border">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="font-heading font-bold text-sm text-dark">{score}</span>
              </div>

              {streak >= 3 && (
                <motion.div
                  key={streak}
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="flex items-center gap-1 bg-orange-100 rounded-full px-2.5 py-1"
                >
                  <Flame className="w-4 h-4 text-orange" />
                  <span className="font-heading font-bold text-xs text-orange">{streak}</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <ModeToggle mode={mode} onChange={handleModeChange} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[480px] mx-auto px-4 pt-6 space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-gray-500">
            Question <span className="font-heading font-bold text-dark">{currentQuestionIndex + 1}</span> /{" "}
            {totalQuestions}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary-dark"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Koko Mascot */}
        <div className="flex justify-center">
          <KokoMascot
            state={mascotState}
            variants={mascotVariants}
            animate={mascotState}
            className="w-32 h-32"
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          {!gameOver && !roundComplete && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FillBlankQuestionComponent
                question={currentQuestion}
                mode={mode}
                onAnswer={handleAnswer}
                disabled={showFeedback}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer Feedback */}
        {showFeedback && isCorrect !== null && (
          <AnswerFeedback
            isCorrect={isCorrect}
            correctAnswer={currentQuestion.correctAnswer}
            visible={showFeedback}
          />
        )}

        {/* Game Over Modal */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6"
              >
                <div className="text-6xl">😢</div>
                <div>
                  <h2 className="font-heading font-extrabold text-2xl text-dark mb-2">Game Over</h2>
                  <p className="font-body text-gray-600">You ran out of hearts!</p>
                </div>
                <div className="bg-background rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-gray-600">Final Score</span>
                    <span className="font-heading font-extrabold text-lg text-dark">{score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-gray-600">Best Streak</span>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange" />
                      <span className="font-heading font-bold text-orange">{streak}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBackHome}
                    className="flex-1 py-3 rounded-2xl border-2 border-card-border font-heading font-bold text-dark"
                  >
                    {t.done}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRestart}
                    className="flex-1 py-3 rounded-2xl btn-aqua"
                  >
                    {t.tryAgain}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Round Complete Modal */}
        <AnimatePresence>
          {roundComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6"
              >
                <div className="text-6xl">🎉</div>
                <div>
                  <h2 className="font-heading font-extrabold text-2xl text-dark mb-2">Round Complete!</h2>
                  <p className="font-body text-gray-600">Amazing work!</p>
                </div>
                <div className="bg-background rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-gray-600">Total Score</span>
                    <span className="font-heading font-extrabold text-lg text-dark">{score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-gray-600">Best Streak</span>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange" />
                      <span className="font-heading font-bold text-orange">{streak}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-gray-600">Hints Used</span>
                    <span className="font-heading font-bold text-gold">{usedHints}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBackHome}
                    className="flex-1 py-3 rounded-2xl border-2 border-card-border font-heading font-bold text-dark"
                  >
                    {t.done}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRestart}
                    className="flex-1 py-3 rounded-2xl btn-gold"
                  >
                    {t.tryAgain}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
