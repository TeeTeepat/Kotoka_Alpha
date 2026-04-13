"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import type { SessionState, SkillResult, WordData, QuestionResult } from "@/types";
import { loadSessionFromStorage, clearSessionStorage } from "@/lib/session/clientStateManager";
import SessionContainer from "@/components/session/SessionContainer";
import SectionCompleteModal from "@/components/session/rewards/SectionCompleteModal";

export default function SessionPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { t } = useLocale();
  const { nodeId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    words: WordData[];
    exercisePrompts: SessionState["exercisePrompts"];
  } | null>(null);
  const [existingState, setExistingState] = useState<SessionState | null>(null);
  const [streak, setStreak] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState<{ coinsEarned: number; accuracy: number } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Check for saved session state
        const saved = loadSessionFromStorage();
        if (saved && saved.nodeId === nodeId) {
          setExistingState(saved);
        }

        // Fetch user stats for streak
        const statsRes = await fetch("/api/user/stats");
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setStreak(stats.streak || 0);
          setHearts(stats.hearts ?? 5);
        }

        // If no saved session, start new one
        if (!saved || saved.nodeId !== nodeId) {
          const sessionRes = await fetch("/api/study/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodeIndex: 0, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          });

          if (!sessionRes.ok) {
            if (sessionRes.status === 404) {
              setError("No due words available. Go snap some photos first!");
            } else {
              setError("Failed to start session. Please try again.");
            }
            return;
          }

          const data = await sessionRes.json();
          setSessionData({
            sessionId: data.sessionId,
            words: data.words,
            exercisePrompts: data.exercisePrompts,
          });
        } else {
          // Resume: fetch words for saved session
          const sessionRes = await fetch("/api/study/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodeIndex: 0, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          });

          if (sessionRes.ok) {
            const data = await sessionRes.json();
            setSessionData({
              sessionId: data.sessionId,
              words: data.words,
              exercisePrompts: data.exercisePrompts,
            });
          }
        }
      } catch (err) {
        console.error("[SessionPage] Init failed:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [nodeId]);

  const handleComplete = async (results: SkillResult[], _coinsEarned: number, completedQuestions: QuestionResult[]) => {
    try {
      // Fix 4: send per-word-per-skill quality results for best-quality SM-2 update
      const skillResults = completedQuestions.map((q) => ({
        wordId: q.wordId,
        skill: q.skill,
        quality: q.quality,
      }));

      const res = await fetch("/api/study/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, skillResults }),
      });

      const data = res.ok ? await res.json() : null;

      // Dispatch stats update event
      window.dispatchEvent(new Event("kotoka-stats-update"));

      // Show reward modal before navigating
      setCompletionData({
        coinsEarned: data?.coinsEarned ?? 0,
        accuracy: (data?.accuracy ?? 0) / 100,
      });
    } catch (err) {
      console.error("[SessionPage] Complete failed:", err);
      // Fall back to navigation on error
      router.push("/review");
    }
  };

  const handleContinue = () => {
    clearSessionStorage();
    router.push("/review");
  };

  const handleExit = () => {
    router.push("/review");
  };

  if (loading) {
    return (
      <div className="py-4 space-y-5">
        <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
        <div className="space-y-4">
          <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 space-y-5">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push("/review")}
            className="w-9 h-9 rounded-full bg-white border-[1.5px] border-card-border shadow-card flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-dark" />
          </motion.button>
          <h1 className="font-heading font-extrabold text-lg text-dark">{t.sessionTitle}</h1>
        </div>
        <div className="card-base p-8 text-center">
          <p className="font-body text-sm text-gray-500">{error}</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push("/review")}
            className="btn-aqua w-full py-3 mt-4">{t.back}</motion.button>
        </div>
      </div>
    );
  }

  if (!sessionData) return null;

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleExit}
          className="w-9 h-9 rounded-full bg-white border-[1.5px] border-card-border shadow-card flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-dark" />
        </motion.button>
        <div>
          <h1 className="font-heading font-extrabold text-base text-dark">{t.sessionTitle}</h1>
          <p className="font-body text-xs text-gray-400">{sessionData.words.length} words</p>
        </div>
      </div>

      <SessionContainer
        sessionId={sessionData.sessionId}
        words={sessionData.words}
        exercisePrompts={sessionData.exercisePrompts}
        existingState={existingState}
        streak={streak}
        hearts={hearts}
        onComplete={handleComplete}
        onExit={handleExit}
      />

      {completionData && (
        <SectionCompleteModal
          accuracy={completionData.accuracy}
          coinsEarned={completionData.coinsEarned}
          streak={streak + 1}
          timeSpent={0}
          wordsReviewed={sessionData.words.length}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
