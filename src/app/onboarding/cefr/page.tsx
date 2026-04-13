"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { cefrTestSections, type SectionScore } from "@/lib/cefrData";
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
type ViewState = "intro" | "question";

export default function CEFRTestPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { play } = useSoundPlayer();

  // Section navigation
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [viewState, setViewState] = useState<ViewState>("intro");

  // Scores per section
  const [sectionScores, setSectionScores] = useState<SectionScore[]>([]);
  const [currentSectionAnswers, setCurrentSectionAnswers] = useState<boolean[]>([]);

  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const directionRef = useRef(1);

  const currentSection = cefrTestSections[sectionIndex];
  const currentQuestion = currentSection?.questions[questionIndex];
  const totalQuestions = cefrTestSections.reduce((s, sec) => s + sec.questions.length, 0);
  const answeredSoFar = sectionScores.reduce((s, sc) => s + sc.total, 0) + questionIndex;
  const progress = (answeredSoFar / totalQuestions) * 100;

  const finishTest = (scores: SectionScore[]) => {
    setConfettiTrigger(true);
    sessionStorage.setItem("cefr_section_scores", JSON.stringify(scores));
    setTimeout(() => router.push("/onboarding/cefr/result"), 1500);
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
        // Next question in this section
        directionRef.current = 1;
        setQuestionIndex((i) => i + 1);
      } else {
        // Section complete — record score
        const correct2 = newAnswers.filter(Boolean).length;
        const newScore: SectionScore = {
          sectionId: currentSection.id,
          correct: correct2,
          total: newAnswers.length,
          ratio: correct2 / newAnswers.length,
        };
        const updatedScores = [...sectionScores, newScore];
        setSectionScores(updatedScores);
        setCurrentSectionAnswers([]);

        if (sectionIndex < cefrTestSections.length - 1) {
          // Move to next section intro
          setSectionIndex((i) => i + 1);
          setQuestionIndex(0);
          setViewState("intro");
        } else {
          // All sections done
          finishTest(updatedScores);
        }
      }
    }, 1000);
  };

  const handleSkip = () => {
    if (answeredSoFar === 0) { router.push("/"); return; }
    // Submit partial
    const partial = [
      ...sectionScores,
      {
        sectionId: currentSection.id,
        correct: currentSectionAnswers.filter(Boolean).length,
        total: Math.max(currentSectionAnswers.length, 1),
        ratio: currentSectionAnswers.filter(Boolean).length / Math.max(currentSectionAnswers.length, 1),
      },
    ];
    sessionStorage.setItem("cefr_section_scores", JSON.stringify(partial));
    router.push("/onboarding/cefr/result");
  };

  // Section progress dots
  const SectionDots = () => (
    <div className="flex items-center justify-center gap-2 mb-2">
      {cefrTestSections.map((sec, i) => {
        const done = i < sectionIndex || (i === sectionIndex && viewState === "intro" && i > 0);
        const active = i === sectionIndex;
        return (
          <motion.div
            key={sec.id}
            animate={{
              width: active ? 28 : 8,
              backgroundColor: done ? "#34d399" : active ? "#1ad3e2" : "#e2e8f0",
            }}
            transition={{ duration: 0.3 }}
            className="h-2 rounded-full"
          />
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-6 max-w-[480px] mx-auto">
      <ParticleEffect type="confetti" trigger={confettiTrigger} position="center" />

      {/* Header */}
      <div className="w-full space-y-3 mb-5">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Kotoka" className="w-12 h-12 rounded-xl shadow-card" />
        </div>

        <SectionDots />

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <p className="font-body text-xs font-semibold text-gray-500">
              {currentSection.icon} {currentSection.title}
            </p>
            <p className="font-body text-xs text-gray-400">
              {answeredSoFar}/{totalQuestions}
            </p>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Koko mascot */}
      <div className="mb-4">
        <motion.div
          variants={mascotVariants}
          animate={mascotState}
          className="w-24 h-24 mx-auto"
        >
          <KokoMascot
            state={(mascotState === "celebrating" ? "celebrating" : mascotState === "thinking" ? "thinking" : "greeting") as KokoState}
            className="w-full h-full"
            priority
          />
        </motion.div>
      </div>

      {/* Main content */}
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
                totalSections={cefrTestSections.length}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${sectionIndex}-${questionIndex}`}
              initial={{ opacity: 0, x: directionRef.current * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: directionRef.current * -60 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {currentQuestion.type === "listening" ? (
                <CEFRListeningCard
                  audioText={(currentQuestion as ListeningQuestion).audioText}
                  question={(currentQuestion as ListeningQuestion).question}
                  options={(currentQuestion as ListeningQuestion).options}
                  correctAnswer={(currentQuestion as ListeningQuestion).correctAnswer}
                  onAnswer={handleAnswer}
                  disabled={isTransitioning}
                />
              ) : currentQuestion.type === "speaking" ? (
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
                    currentQuestion.type === "reading"
                      ? (currentQuestion as ReadingQuestion).question
                      : (currentQuestion as WritingQuestion).sentence
                  }
                  options={
                    currentQuestion.type === "reading"
                      ? (currentQuestion as ReadingQuestion).options
                      : (currentQuestion as WritingQuestion).options
                  }
                  correctAnswer={
                    currentQuestion.type === "reading"
                      ? (currentQuestion as ReadingQuestion).correctAnswer
                      : (currentQuestion as WritingQuestion).correctAnswer
                  }
                  onAnswer={handleAnswer}
                  disabled={isTransitioning}
                  passage={
                    currentQuestion.type === "reading"
                      ? (currentQuestion as ReadingQuestion).passage
                      : undefined
                  }
                />
              )}

              {/* Section progress */}
              <div className="flex justify-center gap-1.5 mt-4">
                {currentSection.questions.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor:
                        i < questionIndex
                          ? "#34d399"
                          : i === questionIndex
                          ? "#1ad3e2"
                          : "#e2e8f0",
                    }}
                    className="w-2 h-2 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowSkipModal(true)}
        className="mt-5 flex items-center gap-1 font-body text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        {t.skip} <ChevronRight className="w-3 h-3" />
      </motion.button>

      {/* Skip modal */}
      <AnimatePresence>
        {showSkipModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSkipModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="card-base bg-white p-6 max-w-sm w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-dark">Skip Test?</h3>
                    <p className="font-body text-sm text-gray-600">
                      {answeredSoFar === 0
                        ? "Your level will be set to A1 (beginner)."
                        : `You've answered ${answeredSoFar} question${answeredSoFar > 1 ? "s" : ""}. We'll use your answers so far.`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowSkipModal(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-body font-semibold text-dark hover:bg-gray-50"
                  >
                    {t.continue}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSkip}
                    className="flex-1 py-3 rounded-xl bg-orange-500 font-body font-semibold text-white hover:bg-orange-600"
                  >
                    {t.skip}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
