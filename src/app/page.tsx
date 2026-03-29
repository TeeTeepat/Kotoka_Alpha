"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Sparkles, BookOpen, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { DeckWithWords } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({ hearts: 5, streak: 0, coins: 0, wordsLearned: 0 });
  const [decks, setDecks] = useState<DeckWithWords[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await fetch("/api/auth/init", { method: "POST" });

        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const user = await userRes.json();
          if (!user.targetLanguage || !user.learningLanguage) {
            router.push("/onboarding/language");
            return;
          }
          setStats(s => ({ ...s, hearts: user.hearts, streak: user.streak, coins: user.coins }));
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
          className="relative w-32 h-32 mx-auto mb-4"
        >
          <Image
            src="/koko-sit-removebg.png"
            alt="Koko"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
        <h1 className="font-heading font-extrabold text-2xl text-dark mb-1">
          Welcome back!
        </h1>
        <p className="font-body text-sm text-gray-500">
          What will you learn today?
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
            Snap & Learn
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
            <p className="font-body text-[11px] text-gray-400">Mastered Words</p>
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
            <p className="font-body text-[11px] text-gray-400">Day Streak</p>
          </div>
        </div>
      </motion.div>

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
    </div>
  );
}
