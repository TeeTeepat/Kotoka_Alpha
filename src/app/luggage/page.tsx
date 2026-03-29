"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface MasteredWord { id: string; word: string; masteryCount: number; lastReviewedAt: string | null; }
interface LuggageItem {
  id: string; type: string; name: string; rarity: string; emoji: string; pulledAt: string;
  isUnlocked: boolean; masteredWord: MasteredWord | null; isFading: boolean;
}
interface LuggageData {
  items: LuggageItem[];
  capacity: { used: number; total: number };
  season: { season: string; nextReset: string };
}

const RARITY_PILL: Record<string, string> = {
  legendary: "bg-yellow-100 text-yellow-700",
  epic: "bg-purple-100 text-purple-700",
  rare: "bg-blue-100 text-blue-700",
  common: "bg-gray-100 text-gray-500",
};

const SEASON_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  "Winter ❄️": { bg: "from-blue-50 to-cyan-50",   border: "border-blue-200",   text: "text-blue-700",   icon: "❄️" },
  "Spring 🌸": { bg: "from-pink-50 to-rose-50",   border: "border-pink-200",   text: "text-pink-700",   icon: "🌸" },
  "Summer ☀️": { bg: "from-amber-50 to-yellow-50", border: "border-amber-200",  text: "text-amber-700",  icon: "☀️" },
  "Autumn 🍂": { bg: "from-orange-50 to-amber-50", border: "border-orange-200", text: "text-orange-700", icon: "🍂" },
};

function LuggageIllustration({ isOpen, onToggle, previewItems }: {
  isOpen: boolean; onToggle: () => void; previewItems: LuggageItem[];
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button onClick={onToggle} whileTap={{ scale: 0.97 }}
        className="relative flex flex-col items-center focus:outline-none" style={{ perspective: 600 }}>
        <div className="w-12 h-4 border-[3px] border-[#6B5A94] rounded-t-full mb-[-2px] z-10" />
        <motion.div animate={{ rotateX: isOpen ? -155 : 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], type: "tween" }}
          style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" }}
          className="relative w-52 z-20">
          <div className="w-52 h-20 bg-gradient-to-b from-[#B09DD6] to-[#9B8AC4] rounded-t-[18px] border-2 border-[#8070B4] flex items-center justify-center shadow-md">
            <div className="w-6 h-6 rounded-full bg-[#6B5A94] border-2 border-[#5A4A84] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#C8B8E8]" />
            </div>
          </div>
          <div style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
            className="absolute inset-0 w-52 h-20 bg-[#E8E0F4] rounded-t-[18px] flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </motion.div>
        <div className="w-52 h-1.5 bg-[#D4C8EC] border-y border-[#8070B4] z-10 flex items-center justify-center gap-1 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#8070B4] flex-shrink-0" />
          ))}
        </div>
        <div className="relative w-52 h-32 bg-gradient-to-b from-[#9B8AC4] to-[#8070B4] rounded-b-[18px] border-2 border-t-0 border-[#8070B4] shadow-lg overflow-hidden flex items-center justify-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#C8B8E8]/40" />
          <AnimatePresence>
            {isOpen && previewItems.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-2 px-4">
                {previewItems.slice(0, 6).map((item, i) => (
                  <motion.span key={item.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
                    className={`text-xl ${item.isFading ? "grayscale opacity-50" : ""}`} title={item.name}>
                    {item.emoji}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {!isOpen && <span className="text-[#C8B8E8]/60 text-xs font-body">tap to open</span>}
        </div>
        <div className="flex justify-between w-44 mt-1">
          {[0, 1].map(i => (
            <div key={i} className="w-5 h-5 rounded-full bg-[#4A4060] border-2 border-[#6B5A94] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8070B4]" />
            </div>
          ))}
        </div>
      </motion.button>
      <p className="text-xs font-body text-gray-400 mt-1">
        {isOpen ? "🔓 Open — tap to close" : "🔒 Tap to open your luggage"}
      </p>
    </div>
  );
}

export default function LuggagePage() {
  const [data, setData] = useState<LuggageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/luggage")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.2, repeat: Infinity, type: "tween" }}
        className="text-4xl">🧳</motion.div>
    </div>
  );

  const items = data?.items ?? [];
  const unlockedItems = items.filter(i => i.isUnlocked);
  const lockedItems = items.filter(i => !i.isUnlocked);
  const seasonKey = data?.season.season ?? "Winter ❄️";
  const sc = SEASON_STYLES[seasonKey] ?? SEASON_STYLES["Winter ❄️"];
  const capacity = data?.capacity ?? { used: 0, total: 100 };

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-dark">🧳 Living Luggage</h1>
          <p className="font-body text-sm text-gray-500">{unlockedItems.length} mastered items</p>
        </div>
        <Link href="/memory-map"
          className="text-xs font-heading font-bold text-primary px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5">
          🗺️ Map
        </Link>
      </div>

      {/* Season banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border bg-gradient-to-r ${sc.bg} ${sc.border} px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className={`font-heading font-extrabold text-sm ${sc.text}`}>{data?.season.season}</p>
          <p className="font-body text-xs text-gray-500">Resets {data?.season.nextReset}</p>
        </div>
        <span className="text-2xl">{sc.icon}</span>
      </motion.div>

      {/* Capacity bar */}
      <div className="card-base p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-heading font-bold text-sm text-dark">Suitcase Capacity</span>
          <span className="font-heading font-bold text-sm text-primary">{capacity.used}/{capacity.total}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((capacity.used / capacity.total) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-lavender"
          />
        </div>
        <p className="font-body text-xs text-gray-400">
          {capacity.total - capacity.used} slots left · Master words to unlock items
        </p>
      </div>

      {/* Luggage illustration */}
      <div className="flex justify-center py-2">
        <LuggageIllustration isOpen={isOpen} onToggle={() => setIsOpen(o => !o)} previewItems={unlockedItems} />
      </div>

      {items.length === 0 ? (
        <div className="card-base p-8 text-center">
          <p className="text-4xl mb-3">🧳</p>
          <p className="font-heading font-bold text-dark mb-1">Empty luggage!</p>
          <p className="text-sm text-gray-500 font-body mb-4">Draw gacha items and master 5 flashcards in a row to fill your suitcase.</p>
          <Link href="/gacha" className="btn-aqua px-6 py-2.5 inline-flex">Go to Gacha</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mastered (unlocked) items */}
          {unlockedItems.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-heading font-extrabold text-sm text-dark">✨ Mastered Collection</h2>
              <div className="grid grid-cols-4 gap-2">
                {unlockedItems.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 22 }}
                    className="rounded-2xl bg-white border border-card-border shadow-card p-2.5 flex flex-col items-center gap-1 relative"
                    style={item.isFading ? { filter: "grayscale(80%)", opacity: 0.5 } : {}}
                    title={item.isFading ? `${item.name} — review needed` : item.name}>
                    {item.isFading && (
                      <span className="absolute top-1 right-1 text-[9px]">💤</span>
                    )}
                    <div className="text-2xl">{item.emoji}</div>
                    <p className="text-[10px] font-heading font-bold text-dark text-center truncate w-full">{item.name}</p>
                    <span className={`text-[9px] font-heading font-bold px-1.5 py-0.5 rounded-pill ${RARITY_PILL[item.rarity]}`}>
                      {item.rarity[0].toUpperCase()}
                    </span>
                    {item.masteredWord && (
                      <span className="text-[8px] font-body text-emerald-600 truncate w-full text-center">
                        "{item.masteredWord.word}"
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Locked items */}
          {lockedItems.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-heading font-extrabold text-sm text-dark">🔒 Locked Items</h2>
              <p className="font-body text-xs text-gray-400">Master more words to unlock</p>
              <div className="grid grid-cols-4 gap-2">
                {lockedItems.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="rounded-2xl bg-gray-50 border-2 border-dashed border-card-border p-2.5 flex flex-col items-center gap-1"
                    style={{ filter: "grayscale(100%)", opacity: 0.35 }}>
                    <div className="text-2xl">{item.emoji}</div>
                    <span className="text-base">🔒</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Fading warning */}
          {unlockedItems.some(i => i.isFading) && (
            <div className="card-base p-3.5 flex items-center gap-2 bg-gray-50">
              <span className="text-lg">💤</span>
              <p className="font-body text-xs text-gray-500">
                Some items are fading — not reviewed in 14+ days. Review those words to restore them.
              </p>
            </div>
          )}
        </div>
      )}

      <Link href="/gacha" className="btn-aqua w-full py-3 block text-center">+ Draw More Items</Link>
    </div>
  );
}
