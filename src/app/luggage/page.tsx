"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { GachaItemData } from "@/types";

const RARITY_PILL: Record<string, string> = {
  legendary: "bg-yellow-100 text-yellow-700",
  epic: "bg-purple-100 text-purple-700",
  rare: "bg-blue-100 text-blue-700",
  common: "bg-gray-100 text-gray-500",
};

// ─── Luggage Illustration ─────────────────────────────────────────────────────
function LuggageIllustration({
  isOpen,
  onToggle,
  previewItems,
}: {
  isOpen: boolean;
  onToggle: () => void;
  previewItems: GachaItemData[];
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.97 }}
        className="relative flex flex-col items-center focus:outline-none"
        aria-label={isOpen ? "Close luggage" : "Open luggage"}
        style={{ perspective: 600 }}
      >
        {/* Handle */}
        <div className="w-12 h-4 border-[3px] border-[#6B5A94] rounded-t-full mb-[-2px] z-10" />

        {/* Lid (flips open on rotateX) */}
        <motion.div
          animate={{ rotateX: isOpen ? -155 : 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], type: "tween" }}
          style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" }}
          className="relative w-52 z-20"
        >
          {/* Lid front face */}
          <div className="w-52 h-20 bg-gradient-to-b from-[#B09DD6] to-[#9B8AC4] rounded-t-[18px] border-2 border-[#8070B4] flex items-center justify-center shadow-md">
            <div className="w-6 h-6 rounded-full bg-[#6B5A94] border-2 border-[#5A4A84] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#C8B8E8]" />
            </div>
          </div>
          {/* Lid inner face (visible when open) */}
          <div
            style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
            className="absolute inset-0 w-52 h-20 bg-[#E8E0F4] rounded-t-[18px] flex items-center justify-center"
          >
            <span className="text-2xl">✨</span>
          </div>
        </motion.div>

        {/* Zipper line */}
        <div className="w-52 h-1.5 bg-[#D4C8EC] border-y border-[#8070B4] z-10 flex items-center justify-center gap-1 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#8070B4] flex-shrink-0" />
          ))}
        </div>

        {/* Body */}
        <div className="relative w-52 h-32 bg-gradient-to-b from-[#9B8AC4] to-[#8070B4] rounded-b-[18px] border-2 border-t-0 border-[#8070B4] shadow-lg overflow-hidden flex items-center justify-center">
          {/* Body stripe */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#C8B8E8]/40" />

          {/* Items inside when open */}
          <AnimatePresence>
            {isOpen && previewItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-2 px-4"
              >
                {previewItems.slice(0, 6).map((item, i) => (
                  <motion.span
                    key={item.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
                    className="text-xl"
                    title={item.name}
                  >
                    {item.emoji}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Closed state label */}
          {!isOpen && (
            <span className="text-[#C8B8E8]/60 text-xs font-body">tap to open</span>
          )}
        </div>

        {/* Wheels */}
        <div className="flex justify-between w-44 mt-1">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full bg-[#4A4060] border-2 border-[#6B5A94] flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#8070B4]" />
            </div>
          ))}
        </div>
      </motion.button>

      {/* Toggle hint */}
      <p className="text-xs font-body text-gray-400 mt-1">
        {isOpen ? "🔓 Open — tap to close" : "🔒 Tap to open your luggage"}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LuggagePage() {
  const [items, setItems] = useState<GachaItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/gacha/items")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const rarityCounts = items.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, type: "tween" }}
          className="text-4xl"
        >
          🧳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-dark">🧳 My Living Luggage</h1>
          <p className="font-body text-sm text-gray-500">{items.length} items collected</p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-col gap-1 items-end">
            {(["legendary", "epic", "rare"] as const).map(
              (r) => rarityCounts[r] && (
                <span key={r} className={`text-[10px] font-heading font-bold px-2 py-0.5 rounded-pill ${RARITY_PILL[r]}`}>
                  {r} ×{rarityCounts[r]}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Luggage illustration */}
      <div className="flex justify-center py-2">
        <LuggageIllustration
          isOpen={isOpen}
          onToggle={() => setIsOpen((o) => !o)}
          previewItems={items}
        />
      </div>

      {/* Items grid — visible when open or always show */}
      <AnimatePresence>
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card-base p-8 text-center"
          >
            <p className="text-4xl mb-3">🧳</p>
            <p className="font-heading font-bold text-dark mb-1">Empty luggage!</p>
            <p className="text-sm text-gray-500 font-body mb-4">Do a gacha draw to start collecting.</p>
            <Link href="/gacha" className="btn-aqua px-6 py-2.5 inline-flex">Go to Gacha</Link>
          </motion.div>
        ) : (
          <motion.div
            key="items"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <h2 className="font-heading font-extrabold text-sm text-dark">✨ Collection</h2>
            <div className="grid grid-cols-4 gap-2">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 22 }}
                  className="rounded-2xl bg-white border border-card-border shadow-card p-2.5 flex flex-col items-center gap-1"
                >
                  <div className="text-2xl">{item.emoji}</div>
                  <p className="text-[10px] font-heading font-bold text-dark text-center truncate w-full leading-tight">
                    {item.name}
                  </p>
                  <span className={`text-[9px] font-heading font-bold px-1.5 py-0.5 rounded-pill ${RARITY_PILL[item.rarity]}`}>
                    {item.rarity[0].toUpperCase()}
                  </span>
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 8 - (items.length % 4 === 0 ? 0 : 4 - (items.length % 4))) }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-2xl border-2 border-dashed border-card-border p-2.5 aspect-square flex items-center justify-center">
                  <span className="text-gray-200 text-xl">+</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Map (simplified) */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-base p-4 space-y-3"
        >
          <h2 className="font-heading font-extrabold text-sm text-dark">🗺️ Memory Map</h2>
          <div className="relative h-28 bg-cyan-50 rounded-2xl overflow-hidden flex items-center justify-center">
            {/* Map grid lines */}
            <div className="absolute inset-0 opacity-20">
              {[25, 50, 75].map((p) => (
                <div key={p} className="absolute inset-x-0 border-t border-primary" style={{ top: `${p}%` }} />
              ))}
              {[25, 50, 75].map((p) => (
                <div key={p} className="absolute inset-y-0 border-l border-primary" style={{ left: `${p}%` }} />
              ))}
            </div>

            {/* Item pins scattered on map */}
            {items.slice(0, 12).map((item, i) => {
              const x = 8 + ((i * 37 + i * 13) % 84);
              const y = 10 + ((i * 29 + i * 7) % 72);
              return (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute text-lg"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  title={item.name}
                >
                  {item.emoji}
                </motion.div>
              );
            })}
          </div>
          <p className="text-xs font-body text-gray-400 text-center">
            Each item marks a memory in your journey
          </p>
        </motion.div>
      )}

      {/* Go draw more */}
      {items.length > 0 && (
        <Link href="/gacha" className="btn-aqua w-full py-3 block text-center">
          + Draw More Items
        </Link>
      )}
    </div>
  );
}
