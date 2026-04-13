"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Crown, Medal } from "lucide-react";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { useLocale } from "@/lib/i18n";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  wordsMastered: number;
  cefrLevel: string;
  coinsAwarded: number;
  isCurrentUser?: boolean;
}

const CEFR_LEVELS = ["All", "A1", "A2", "B1", "B2", "C1", "C2"];

const MOCK_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: "u1", name: "Nong Mint", wordsMastered: 142, cefrLevel: "B2", coinsAwarded: 300, isCurrentUser: false },
  { rank: 2, userId: "u2", name: "Khun Ploy", wordsMastered: 128, cefrLevel: "B2", coinsAwarded: 200, isCurrentUser: false },
  { rank: 3, userId: "u3", name: "P'Arm", wordsMastered: 119, cefrLevel: "B1", coinsAwarded: 100, isCurrentUser: false },
  { rank: 4, userId: "u4", name: "Neng", wordsMastered: 98, cefrLevel: "B1", coinsAwarded: 50, isCurrentUser: true },
  { rank: 5, userId: "u5", name: "Ton", wordsMastered: 87, cefrLevel: "A2", coinsAwarded: 50, isCurrentUser: false },
  { rank: 6, userId: "u6", name: "Ae", wordsMastered: 74, cefrLevel: "B1", coinsAwarded: 50, isCurrentUser: false },
  { rank: 7, userId: "u7", name: "Jane", wordsMastered: 61, cefrLevel: "A2", coinsAwarded: 50, isCurrentUser: false },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="font-heading font-bold text-sm text-gray-400">#{rank}</span>;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { play } = useSoundPlayer();
  const { t } = useLocale();
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(MOCK_ENTRIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ week: "current" });
    if (selectedLevel !== "All") params.set("cefr", selectedLevel);

    fetch(`/api/community/leaderboard?${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.entries) && data.entries.length > 0) {
          setEntries(data.entries);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedLevel]);

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-card-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-[480px] mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => { play("click"); router.back(); }}
            className="w-10 h-10 rounded-full bg-white border border-card-border flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-heading font-extrabold text-lg text-dark">{t.leaderboardTitle}</h1>
            <p className="font-body text-xs text-gray-500">{t.leaderboardSubtitle}</p>
          </div>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>

        {/* CEFR filter */}
        <div className="flex gap-1.5 mt-3 max-w-[480px] mx-auto overflow-x-auto pb-1 scrollbar-hide">
          {CEFR_LEVELS.map(level => (
            <motion.button
              key={level}
              whileTap={{ scale: 0.95 }}
              onClick={() => { play("click"); setSelectedLevel(level); }}
              className={`px-3 py-1.5 rounded-full font-heading font-bold text-xs flex-shrink-0 transition-all ${
                selectedLevel === level
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-card-border text-gray-500"
              }`}
            >
              {level}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Podium top 3 */}
            {topThree.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-center gap-3 pt-4 pb-6"
              >
                {/* 2nd */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-lg font-heading font-bold text-gray-600">
                    {topThree[1].name.charAt(0)}
                  </div>
                  <p className="font-body text-xs text-gray-600 text-center truncate w-16">{topThree[1].name}</p>
                  <div className="w-20 h-16 bg-gray-200 rounded-t-xl flex items-center justify-center">
                    <Medal className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <Crown className="w-6 h-6 text-yellow-500 mb-1" />
                  </motion.div>
                  <div className="w-14 h-14 rounded-full bg-yellow-50 border-2 border-yellow-400 flex items-center justify-center text-xl font-heading font-bold text-yellow-600">
                    {topThree[0].name.charAt(0)}
                  </div>
                  <p className="font-body text-xs text-gray-700 font-medium text-center truncate w-16">{topThree[0].name}</p>
                  <div className="w-20 h-24 bg-yellow-400 rounded-t-xl flex items-center justify-center">
                    <span className="font-heading font-extrabold text-white text-lg">1</span>
                  </div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-lg font-heading font-bold text-amber-600">
                    {topThree[2].name.charAt(0)}
                  </div>
                  <p className="font-body text-xs text-gray-600 text-center truncate w-16">{topThree[2].name}</p>
                  <div className="w-20 h-10 bg-amber-200 rounded-t-xl flex items-center justify-center">
                    <Medal className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rest of entries */}
            <AnimatePresence>
              {rest.map((entry, i) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`card-base p-4 flex items-center gap-3 ${entry.isCurrentUser ? "border-primary/40 bg-primary/5" : ""}`}
                >
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    <RankBadge rank={entry.rank} />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-heading font-bold text-base text-gray-600 flex-shrink-0">
                    {entry.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-bold text-sm text-dark truncate">{entry.name}</p>
                      {entry.isCurrentUser && (
                        <span className="text-[10px] font-body text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">You</span>
                      )}
                    </div>
                    <p className="font-body text-xs text-gray-500">{entry.cefrLevel} · {entry.wordsMastered} words</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-base">🪙</span>
                    <span className="font-heading font-bold text-sm text-gold">+{entry.coinsAwarded}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
