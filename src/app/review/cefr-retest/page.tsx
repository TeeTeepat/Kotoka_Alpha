"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronRight, Lock } from "lucide-react";
import { retestSections, calculateCEFRResult, type SectionScore } from "@/lib/cefrData";
import { mascotVariants } from "@/components/animations/mascotVariants";
import KokoMascot from "@/components/KokoMascot";
import type { KokoState } from "@/components/KokoMascot";
import { ParticleEffect } from "@/components/ParticleEffect";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { CEFRQuestionCard } from "@/components/cefr/CEFRQuestionCard";
import { CEFRSectionIntro } from "@/components/cefr/CEFRSectionIntro";
import { CEFRListeningCard } from "@/components/cefr/CEFRListeningCard";
import { CEFRSpeakingCard } from "@/components/cefr/CEFRSpeakingCard";
import type { ReadingQuestion, WritingQuestion, ListeningQuestion, SpeakingQuestion } from "@/lib/cefrData";
import { useLocale } from "@/lib/i18n";

type MascotState = "idle" | "thinking" | "celebrating";
type ViewState = "intro" | "question" | "locked";

export default function CEFRRetestPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { play } = useSoundPlayer();

  const [viewState, setViewState] = useState<ViewState>("locked");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sectionScores, setSectionScores] = useState<SectionScore[]>([]);
  const [currentSectionAnswers, setCurrentSectionAnswers] = useState<boolean[]>([]);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const directionRef = useRef(1);

  useEffect(() => {
    async function checkAccess() {
      const alreadyDone = localStorage.getItem("kotoka_cefr_retest_done") === "true";
      if (alreadyDone) { setViewState("locked"); return; }

      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const user = await res.json();
          setUserStreak(user.streak ?? 0);
          if ((user.streak ?? 0) >= 3) {
            setViewState("intro");
          } else {
            setViewState("locked");
          }
        }
      } catch {
        setViewState("locked");
      }
    }
    checkAccess();
  }, []);

  const currentSection = retestSections[sectionIndex];
  const currentQuestion = currentSection?.questions[questionIndex];
  const totalQuestions = retestSections.reduce((s, sec) => s + sec.questions.length, 0);
  const answeredSoFar = sectionScores.reduce((s, sc) => s + sc.total, 0) + questionIndex;
  const progress = (answeredSoFar / totalQuestions) * 100;

  const finishTest = async (scores: SectionScore[]) => {
    const result = calculateCEFRResult(scores);
    setConfettiTrigger(true);
    play("correct");

    localStorage.setItem("kotoka_cefr_level", result.level);
    localStorage.setItem("kotoka_cefr_retest_done", "true");

    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cefrLevel: result.level }),
      });
    } catch { /* ignore */ }

    window.dispatchEvent(new CustomEvent("kotoka-stats-update", {
      detail: { cefrLevel: result.level },
    }));

    setTimeout(() => router.push("/"), 2000);
  };

  const handleAnswer = (correct: boolean) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    if (correct) { play("correct"); setMascotState("celebrating"); }
    else { play("wrong"); setMascotState("thinking"); }

    const newAnswers = [...currentSectionAnswers, correct];
    setCurrentSectionAnswers(newAnswers);

    setTimeout(() => {
      setMascotState("idle");
      setIsTransitioning(false);

      if (questionIndex < currentSection.questions.length - 1) {
        directionRef.current = 1;
        setQuestionIndex((i) => i + 1);
      } else {
        const correct2 = newAnswers.filter(Boolean).length;
        const newScore: SectionScore = {
          sectionId: currentSection.id,
          correct: correct2,
          total: newAnswers.length,
          ratio: correct2 / newAnswers.length,
        };
        const updated = [...sectionScores, newScore];
        setSectionScores(updated);
        setCurrentSectionAnswers([]);

        if (sectionIndex < retestSections.length - 1) {
          setSectionIndex((i) => i + 1);
          setQuestionIndex(0);
          setViewState("intro");
        } else {
          finishTest(updated);
        }
      }
    }, 1000);
  };

  // Locked state
  if (viewState === "locked") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 max-w-[480px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base bg-white p-8 text-center space-y-5 w-full max-w-sm"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-dark mb-2">
              {localStorage.getItem("kotoka_cefr_retest_done") === "true"
                ? "Retest Complete"
                : "Keep the Streak!"}
            </h2>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              {localStorage.getItem("kotoka_cefr_retest_done") === "true"
                ? "You've already completed your retest. Your updated CEFR level has been saved."
                : `This retest unlocks after a 3-day learning streak. You're at ${userStreak} day${userStreak !== 1 ? "s" : ""} — keep going!`}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/")}
            className="btn-aqua w-full py-3"
          >
            {t.back}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-6 max-w-[480px] mx-auto">
      <ParticleEffect type="confetti" trigger={confettiTrigger} position="center" />

      {/* Header */}
      <div className="w-full space-y-3 mb-5">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Kotoka" className="w-12 h-12 rounded-xl shadow-card" />
        </div>

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 font-body font-bold text-xs px-3 py-1 rounded-full">
            🔥 3-Day Streak Retest · Beta
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <p className="font-body text-xs font-semibold text-gray-500">
              {currentSection?.icon} {currentSection?.title}
            </p>
            <p className="font-body text-xs text-gray-400">{answeredSoFar}/{totalQuestions}</p>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Mascot */}
      <div className="mb-4">
        <KokoMascot
          state={mascotState as KokoState}
          variants={mascotVariants}
          animate={mascotState}
          className="w-24 h-24 mx-auto"
          priority
        />
      </div>

      {/* Content */}
      <div className="w-full flex-1">
        <AnimatePresence mode="wait">
          {viewState === "intro" ? (
            <motion.div
              key={`intro-${sectionIndex}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
            >
              <CEFRSectionIntro
                icon={currentSection.icon}
                title={currentSection.title}
                description={currentSection.description}
                questionCount={currentSection.questions.length}
                onStart={() => setViewState("question")}
                sectionIndex={sectionIndex}
                totalSections={retestSections.length}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${sectionIndex}-${questionIndex}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
            >
              {currentQuestion?.type === "listening" ? (
                <CEFRListeningCard
                  audioText={(currentQuestion as ListeningQuestion).audioText}
                  question={(currentQuestion as ListeningQuestion).question}
                  options={(currentQuestion as ListeningQuestion).options}
                  correctAnswer={(currentQuestion as ListeningQuestion).correctAnswer}
                  onAnswer={handleAnswer}
                  disabled={isTransitioning}
                />
              ) : currentQuestion?.type === "speaking" ? (
                <CEFRSpeakingCard
                  prompt={(currentQuestion as SpeakingQuestion).prompt}
                  keywords={(currentQuestion as SpeakingQuestion).keywords}
                  exampleAnswer={(currentQuestion as SpeakingQuestion).exampleAnswer}
                  onAnswer={(correct) => handleAnswer(correct)}
                  disabled={isTransitioning}
                />
              ) : (
                <CEFRQuestionCard
                  sentence={
                    currentQuestion?.type === "reading"
                      ? (currentQuestion as ReadingQuestion).question
                      : (currentQuestion as WritingQuestion).sentence
                  }
                  options={
                    currentQuestion?.type === "reading"
                      ? (currentQuestion as ReadingQuestion).options
                      : (currentQuestion as WritingQuestion).options
                  }
                  correctAnswer={
                    currentQuestion?.type === "reading"
                      ? (currentQuestion as ReadingQuestion).correctAnswer
                      : (currentQuestion as WritingQuestion).correctAnswer
                  }
                  onAnswer={handleAnswer}
                  disabled={isTransitioning}
                  passage={
                    currentQuestion?.type === "reading"
                      ? (currentQuestion as ReadingQuestion).passage
                      : undefined
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-5 flex items-center gap-1 font-body text-sm text-gray-400 hover:text-gray-600"
      >
        {t.skip} <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
