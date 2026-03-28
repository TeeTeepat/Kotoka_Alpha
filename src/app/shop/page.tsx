"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import type { UserData } from "@/types";

const SHOP_ITEMS = [
  {
    id: "heart1",
    emoji: "❤️",
    name: "Refill 1 Heart",
    description: "Restore one heart",
    price: 20,
  },
  {
    id: "heartAll",
    emoji: "❤️❤️❤️❤️❤️",
    name: "Refill All Hearts",
    description: "Full heart refill",
    price: 95,
  },
  {
    id: "streakFreeze",
    emoji: "🧊",
    name: "Streak Freeze",
    description: "Protect tomorrow's streak",
    price: 50,
  },
];

const GACHA_CARDS = [
  { type: "luggage", emoji: "🧳", name: "Luggage Draw", price: 100 },
  { type: "vocab_pack", emoji: "📚", name: "Vocab Pack Draw", price: 80 },
];

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data));
  }, []);

  async function handleBuy(item: string) {
    if (buying) return;
    setBuying(item);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        window.dispatchEvent(new Event("kotoka-stats-update"));
      }
    } finally {
      setBuying(null);
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
    <div className="py-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-xl text-dark">
          🏪 The Shop
        </h1>
        <div className="flex items-center gap-1.5 bg-white rounded-pill px-3 py-1.5 border border-card-border shadow-card">
          <Coins className="w-4 h-4 text-gold" />
          <span className="font-heading font-bold text-sm text-dark">
            {user.coins}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {SHOP_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-base p-4 flex items-center gap-4"
          >
            <div className="text-3xl">{item.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-dark text-sm">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 font-body">{item.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-gold/20 text-gold font-heading font-bold text-xs px-2.5 py-0.5 rounded-pill">
                {item.price}c
              </span>
              <button
                onClick={() => handleBuy(item.id)}
                disabled={user.coins < item.price || buying === item.id}
                className="btn-aqua px-4 py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {buying === item.id ? "..." : "Buy"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-2">
        <h2 className="font-heading font-extrabold text-lg text-dark mb-3">
          🎰 Gacha Draws
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {GACHA_CARDS.map((card, i) => (
            <motion.div
              key={card.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.21 + i * 0.07 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push("/gacha")}
              className="card-base p-4 text-center cursor-pointer"
            >
              <div className="text-5xl mb-2">{card.emoji}</div>
              <p className="font-heading font-bold text-dark text-sm">
                {card.name}
              </p>
              <span className="bg-gold/20 text-gold font-heading font-bold text-xs px-2.5 py-0.5 rounded-pill mt-1 inline-block">
                {card.price}c
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
