"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Sparkles, BookOpen, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import KokoMascot from "@/components/KokoMascot";
import ForgettingCurveWidget from "@/components/dashboard/ForgettingCurveWidget";
import type { DeckWithWords } from "@/types";
import { useLocale } from "@/lib/i18n";

export default function HomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [stats, setStats] = useState({ hearts: 5, streak: 0, coins: 0, wordsLearned: 0 });
  const [showRetestBanner, setShowRetestBanner] = useState(false);
  const [decks, setDecks] = useState<DeckWithWords[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await fetch("/api/auth/init", { method: "POST" });

        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const user = await userRes.json();
          if (!user.isOnboarded || !user.targetLanguage || !user.learningLanguage) {
            router.push("/onboarding/language");
            return;
          }
setStats(s => ({ ...s, hearts: user.hearts, streak: user.streak, coins: user.coins }));
          if ((user.streak ?? 0) >= 3 && localStorage.getItem("kotoka_cefr_retest_done") !== "true") {
            setShowRetestBanner(true);
          }
        }

        const deckRes = await fetch("/api/decks");
        const data = await deckRes.json();
        if (Array.isArray(data)) {
          setDecks(data);
          const masteredWords = data.reduce((acc: number, d: { words: { masteryCount: number; interval: number }[] }) =>
            acc + d.words.filter(w => w.masteryCount >= 5 || w.interval >= 21).length, 0);
          setStats(s => ({ ...s, wordsLearned: masteredWords }));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        window.dispatchEvent(new Event("kotoka-app-ready"));
      }
    }

    load();
  }, [router]);

  return (
    <div className="py-4 space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 mx-auto mb-4"
        >
          <KokoMascot state="greeting" className="w-32 h-32" priority />
        </motion.div>
        <h1 className="font-heading font-extrabold text-2xl text-dark mb-1">
          {t.homeGreeting}!
        </h1>
        <p className="font-body text-sm text-gray-500">
          {t.homeSubtitle}
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Link href="/snap">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-aqua w-full py-4 px-6 text-base animate-pulse-glow"
          >
            <Camera className="w-5 h-5" />
            {t.homeStartSnap}
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </Link>
      </motion.div>

      {/* Today's Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-lavender/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent-plum" />
          </div>
          <div>
            <p className="font-heading font-extrabold text-xl text-dark">
              {stats.wordsLearned}
            </p>
            <p className="font-body text-[11px] text-gray-400">{t.homeWordsLearned}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange" />
          </div>
          <div>
            <p className="font-heading font-extrabold text-xl text-dark">
              {stats.streak}
            </p>
            <p className="font-body text-[11px] text-gray-400">{t.homeStreakDays}</p>
          </div>
        </div>
      </motion.div>

      {/* CEFR Retest Banner (streak >= 3, beta) */}
      {showRetestBanner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Link href="/review/cefr-retest">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 shadow-sm cursor-pointer"
            >
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                🔥
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-extrabold text-sm text-orange-700">
                  3-Day Streak Unlocked!
                </p>
                <p className="font-body text-xs text-orange-500 truncate">
                  Take a quick CEFR retest to update your level
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
            </motion.div>
          </Link>
        </motion.div>
      )}

      {/* Recent Decks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className="font-heading font-extrabold text-lg text-dark mb-3">
          Recent Decks
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card-base p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="card-base p-8 text-center">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Camera className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            </motion.div>
            <p className="font-body text-sm text-gray-400">
              No decks yet. Snap a photo to start learning!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {decks.slice(0, 5).map((deck, index) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link href={`/review?deck=${deck.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="card-base p-4 flex items-center gap-3"
                  >
                    <div
                      className="w-3 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: deck.colorPalette }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-extrabold text-sm text-dark truncate">
                        {deck.sceneDesc}
                      </p>
                      <p className="font-body text-[11px] text-gray-400">
                        {deck.words.length} words &middot;{" "}
                        {new Date(deck.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-body font-medium text-primary">
                      Review
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      {/* Weekly Story Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Link href="/story">
          <motion.div
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="card-base p-4 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-extrabold text-sm text-dark">Weekly Story</p>
              <p className="font-body text-[11px] text-gray-400">Read & learn new words</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </motion.div>
        </Link>
      </motion.div>

      {/* Forgetting Curve Widget */}
      <ForgettingCurveWidget decks={decks} loading={loading} />
    </div>
  );
}
