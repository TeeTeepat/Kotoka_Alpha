"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import KokoMascot from "@/components/KokoMascot";
import { StoryDisplay } from "@/components/story/StoryDisplay";
import { ReflectionChoice } from "@/components/story/ReflectionChoice";
import { ParticleEffect } from "@/components/ParticleEffect";
import { mascotVariants } from "@/components/animations/mascotVariants";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { useLocale } from "@/lib/i18n";
import { weeklyStory } from "@/lib/mockData";
import type { MascotState } from "@/components/animations/mascotVariants";

export default function StoryPage() {
  const router = useRouter();
  const { play } = useSoundPlayer();
  const { t } = useLocale();
  const [story, setStory] = useState(weeklyStory);
  const [selectedReflection, setSelectedReflection] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>("encouraging");
  const [loadingStory, setLoadingStory] = useState(true);
  const [noStory, setNoStory] = useState(false);

  // Try to fetch real story, fall back to mock
  useEffect(() => {
    fetch("/api/story/current")
      .then(r => r.json())
      .then(data => {
        if (data && data.storyText) {
          // Convert API story to display format
          const words = (data.wordsUsed ?? []) as string[];
          setStory({
            ...weeklyStory,
            text: data.storyText,
            emoji: "📖",
            title: "Your Week in Words",
            highlightedWords: words.map((w: string) => ({ word: w, definition: w })),
            reflectionQuestion: {
              question: data.reflectionQ ?? "Which word felt most natural this week?",
              options: words.slice(0, 3),
            },
          });
        } else {
          // No story yet — try to generate one
          fetch("/api/story/generate", { method: "POST" })
            .then(r => r.json())
            .then(generated => {
              if (generated.storyText) {
                const words = (generated.wordsUsed ?? []) as string[];
                setStory({
                  ...weeklyStory,
                  text: generated.storyText,
                  emoji: "📖",
                  title: "Your Week in Words",
                  highlightedWords: words.map((w: string) => ({ word: w, definition: w })),
                  reflectionQuestion: {
                    question: generated.reflectionQ ?? "Which word felt most natural?",
                    options: words.slice(0, 3),
                  },
                });
              } else {
                setNoStory(true);
              }
            })
            .catch(() => setNoStory(true));
        }
      })
      .catch(() => {/* use mock */ })
      .finally(() => setLoadingStory(false));
  }, []);

  // Handle reflection selection
  const handleReflectionSelect = (word: string) => {
    if (selectedReflection) return; // Prevent multiple selections

    setSelectedReflection(word);
    play("correct");

    // Trigger celebration after a brief delay
    setTimeout(() => {
      setShowCelebration(true);
      setIsCompleted(true);
      setMascotState("celebrating");
      play("fanfare");

      // Hide celebration modal after animation
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }, 500);
  };

  // Get current date for week display
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const getCurrentMonth = () => {
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return months[new Date().getMonth()];
  };

  if (loadingStory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="font-body text-sm text-gray-500">Koko is preparing your story...</p>
        </div>
      </div>
    );
  }

  if (noStory) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm"
        >
          <div className="w-24 h-24 mx-auto mb-4">
            <KokoMascot state="encouraging" className="w-full h-full" />
          </div>
          <h2 className="font-heading font-extrabold text-xl text-dark mb-2">
            {t.storyNoContent}
          </h2>
          <p className="font-body text-sm text-gray-500 mb-6">
            Snap at least 3 words and Koko will write your story on Sunday night!
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/snap")}
            className="btn-aqua px-6 py-3"
          >
            Start Snapping
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-card-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-[480px] mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-card-border flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </motion.button>

          <div className="flex-1">
            <h1 className="font-heading font-extrabold text-lg text-dark">
              {t.storyTitle}
            </h1>
            <p className="font-body text-xs text-gray-500">
              Week {getCurrentWeek()} — {getCurrentMonth()} 2026
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-[480px] mx-auto space-y-6">
        {/* Words Collected */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="card-base p-4 flex items-center gap-3"
        >
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm text-dark">
              Your words this week
            </p>
            <p className="font-body text-xs text-gray-500 mt-0.5">
              {story.highlightedWords.length} collected
            </p>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-heading font-extrabold text-lg text-dark">
              {story.highlightedWords.length}/{story.highlightedWords.length}
            </span>
          </div>
        </motion.div>

        {/* Story Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          <span className="text-4xl">{story.emoji}</span>
          <h2 className="font-heading font-extrabold text-xl text-dark mt-2">
            {story.title}
          </h2>
        </motion.div>

        {/* Story Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="card-base p-6"
        >
          <StoryDisplay
            text={story.text}
            highlightedWords={story.highlightedWords}
          />
        </motion.div>

        {/* Word Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {story.highlightedWords.map((word, index) => (
            <motion.div
              key={word.word}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + (index * 0.05), duration: 0.3 }}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full"
            >
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="font-body text-xs font-medium text-primary-dark">
                {word.word}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Reflection Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="card-base p-6"
        >
          <ReflectionChoice
            question={story.reflectionQuestion.question}
            options={story.reflectionQuestion.options}
            onSelect={handleReflectionSelect}
            selectedWord={selectedReflection ?? undefined}
          />
        </motion.div>

        {/* Koko Mascot */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex justify-center py-4"
        >
          <KokoMascot
            state={mascotState}
            variants={mascotVariants}
            animate={mascotState}
            className="w-32 h-32"
          />
        </motion.div>

        {/* Action Buttons */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsCompleted(false);
                  setSelectedReflection(null);
                  setMascotState("encouraging");
                }}
                className="flex-1 btn-aqua py-3"
              >
                {t.storyRead}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/")}
                className="flex-1 btn-gold py-3"
              >
                {t.done}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <>
            <ParticleEffect
              type="confetti"
              trigger={showCelebration}
              position="center"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 0.6 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h3 className="font-heading font-extrabold text-2xl text-dark mb-2">
                  {t.storyComplete}
                </h3>
                <p className="font-body text-sm text-gray-500 mb-4">
                  Amazing work practicing your vocabulary!
                </p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full"
                >
                  <span className="text-2xl">🪙</span>
                  <span className="font-heading font-extrabold text-lg text-gold">+10 coins</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
