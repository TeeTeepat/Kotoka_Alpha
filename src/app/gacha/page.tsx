"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Coins } from "lucide-react";
import type { UserData, GachaItemData } from "@/types";

const TABS = [
  { type: "luggage" as const, label: "🧳 Luggage Draw", price: 100 },
  { type: "vocab_pack" as const, label: "📚 Vocab Pack", price: 80 },
];

const RARITY_STYLES: Record<string, string> = {
  legendary: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white",
  epic: "bg-purple-500 text-white",
  rare: "bg-blue-500 text-white",
  common: "bg-gray-400 text-white",
};

export default function GachaPage() {
  const router = useRouter();
  const [type, setType] = useState<"luggage" | "vocab_pack">("luggage");
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<GachaItemData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data));
  }, []);

  const currentTab = TABS.find((t) => t.type === type)!;
  const canDraw = user && user.coins >= currentTab.price;

  async function handleDraw() {
    if (pulling || !canDraw) return;
    setPulling(true);
    setResult(null);

    try {
      const res = await fetch("/api/gacha/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        const data = await res.json();
        // Show animation for 1.5s then reveal result
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setResult(data.item);
        setUser(data.user);
        window.dispatchEvent(new Event("kotoka-stats-update"));
      }
    } finally {
      setPulling(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-primary font-heading font-bold">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-500 hover:text-dark transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-body text-sm">Back</span>
        </button>
        <div className="flex items-center gap-1.5 bg-white rounded-pill px-3 py-1.5 border border-card-border shadow-card">
          <Coins className="w-4 h-4 text-gold" />
          <span className="font-heading font-bold text-sm text-dark">
            {user.coins}
          </span>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => {
              setType(tab.type);
              setResult(null);
            }}
            className={`flex-1 rounded-pill py-2.5 px-3 font-heading font-bold text-sm transition-all duration-200 ${
              type === tab.type
                ? "bg-primary text-white shadow-btn-aqua"
                : "bg-white text-gray-500 border border-card-border"
            }`}
          >
            {tab.label} {tab.price}c
          </button>
        ))}
      </div>

      {/* Draw area */}
      <div className="card-base p-8 flex flex-col items-center justify-center min-h-[320px]">
        <AnimatePresence mode="wait">
          {!pulling && !result && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-7xl"
              >
                🎰
              </motion.div>
              <p className="font-heading font-bold text-dark">Tap to Draw!</p>
              {canDraw ? (
                <button onClick={handleDraw} className="btn-gold px-8 py-3">
                  Draw Now
                </button>
              ) : (
                <p className="text-sm text-red-400 font-body">
                  Not enough coins ({currentTab.price}c needed)
                </p>
              )}
            </motion.div>
          )}

          {pulling && (
            <motion.div
              key="pulling"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1], rotate: [0, 360] }}
              transition={{ duration: 1.5, ease: "easeInOut", type: "tween" }}
              className="text-7xl"
            >
              {type === "luggage" ? "🧳" : "📚"}
            </motion.div>
          )}

          {!pulling && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <span
                className={`px-3 py-1 rounded-pill text-xs font-heading font-bold uppercase ${RARITY_STYLES[result.rarity]}`}
              >
                {result.rarity}
              </span>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: [0.5, 1] }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="text-7xl"
              >
                {result.emoji}
              </motion.div>
              <p className="font-heading font-extrabold text-xl text-dark">
                {result.name}
              </p>
              <div className="flex gap-3 mt-2">
                <button onClick={handleDraw} className="btn-gold px-6 py-2.5">
                  Draw Again
                </button>
                <button
                  onClick={() => router.push("/luggage")}
                  className="btn-aqua px-6 py-2.5"
                >
                  View Luggage
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
