"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sparkles, Home } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { cefrQuestions, calculateCEFR } from "@/lib/mockData";
import { calculateCEFRResult, type SectionScore } from "@/lib/cefrData";
import { mascotVariants } from "@/components/animations/mascotVariants";
import KokoMascot from "@/components/KokoMascot";
import { ParticleEffect } from "@/components/ParticleEffect";
import { CEFRResultReveal } from "@/components/cefr/CEFRResultReveal";

export default function CEFRResultPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [result, setResult] = useState(calculateCEFR(
    Array(20).fill(false),
    cefrQuestions
  ));
  const [showActions, setShowActions] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Prefer new 4-section scores, fall back to legacy answers
    const sectionScoresStr = sessionStorage.getItem("cefr_section_scores");
    if (sectionScoresStr) {
      try {
        const scores: SectionScore[] = JSON.parse(sectionScoresStr);
        setResult(calculateCEFRResult(scores));
      } catch { /* fall through to legacy */ }
    }

    const answersStr = sessionStorage.getItem("cefr_answers");
    if (!sectionScoresStr && answersStr) {
      try {
        const answers = JSON.parse(answersStr);
        const calculatedResult = calculateCEFR(answers, cefrQuestions);
        setResult(calculatedResult);
      } catch (error) {
        console.error("Failed to parse CEFR answers:", error);
      }
    }

    // Trigger confetti after a short delay
    const timer = setTimeout(() => setConfettiTrigger(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setShowActions(true);
  }, []);

  const handleStartLearning = async () => {
    setSaving(true);

    try {
      // Store result in localStorage
      localStorage.setItem("kotoka_cefr_level", result.level);
      localStorage.setItem("kotoka_cefr_sublevel", result.sublevel.toString());
      localStorage.setItem("kotoka_cefr_progress", result.progress.toString());
      localStorage.setItem("kotoka_cefr_test_complete", "true");

      // Mark user as fully onboarded in DB, persist CEFR level
      const level = (result.level ?? "").toUpperCase() as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnboarded: true, cefrLevel: level }),
      });

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("kotoka-stats-update", {
        detail: { cefrLevel: result.level }
      }));

      // Navigate to home
      await router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to save CEFR result:", error);
      setSaving(false);
    }
  };

  const handleRetake = () => {
    // Clear session storage
    sessionStorage.removeItem("cefr_answers");
    router.push("/onboarding/cefr");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 max-w-[480px] mx-auto">
      {/* Confetti effect */}
      <ParticleEffect
        type="confetti"
        trigger={confettiTrigger}
        position="center"
      />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Kotoka"
            className="w-14 h-14 rounded-2xl shadow-card"
          />
        </div>

        <h1 className="font-heading font-extrabold text-3xl text-dark mb-2">
          {t.onboardResultTitle}
        </h1>
        <p className="font-body text-gray-600">
          Based on your placement test
        </p>
      </motion.div>

      {/* Koko mascot celebrating */}
      <KokoMascot
        state="celebrating"
        variants={mascotVariants}
        animate="celebrating"
        className="w-28 h-28 mb-6"
        priority
      />

      {/* Result reveal */}
      <CEFRResultReveal result={result} onComplete={handleRevealComplete} />

      {/* Action buttons */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full max-w-xs space-y-3 mt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartLearning}
              disabled={saving}
              className="w-full btn-aqua py-4 text-base font-body font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t.onboardResultContinue}
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetake}
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 font-body font-semibold text-dark hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {t.onboardResultRetake}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/")}
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl font-body font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Home className="w-4 h-4" />
              {t.back}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
