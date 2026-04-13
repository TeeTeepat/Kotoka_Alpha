"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Heart, Flame, Coins, Award } from "lucide-react";
import Image from "next/image";

export default function StatusBar() {
  const [stats, setStats] = useState({ hearts: 5, streak: 0, coins: 0, cefrLevel: null as string | null });
  const [nextHeartAt, setNextHeartAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    async function init() {
      if (initialized.current) return;
      initialized.current = true;

      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const user = await res.json();
          setStats(s => ({ ...s, hearts: user.hearts, streak: user.streak, coins: user.coins }));
        }
      } catch { /* Not authenticated */ }

      const savedLevel = localStorage.getItem("kotoka_cefr_level");
      if (savedLevel) setStats(s => ({ ...s, cefrLevel: savedLevel }));
    }

    init();

    const handleUpdate = async () => {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const user = await res.json();
          setStats(s => ({ ...s, hearts: user.hearts, streak: user.streak, coins: user.coins }));
        }
      } catch { /* Silently fail */ }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kotoka_cefr_level" && e.newValue) {
        setStats(s => ({ ...s, cefrLevel: e.newValue }));
      }
    };

    window.addEventListener("kotoka-stats-update", handleUpdate);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("kotoka-stats-update", handleUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Poll /api/user/hearts for nextHeartAt when hearts < 5
  useEffect(() => {
    if (stats.hearts >= 5) {
      setNextHeartAt(null);
      return;
    }

    async function fetchHearts() {
      try {
        const res = await fetch("/api/user/hearts");
        if (res.ok) {
          const data = await res.json();
          setStats(s => ({ ...s, hearts: data.hearts }));
          setNextHeartAt(data.nextHeartAt ?? null);
        }
      } catch { /* Silently fail */ }
    }

    fetchHearts();
    const interval = setInterval(fetchHearts, 60000);
    return () => clearInterval(interval);
  }, [stats.hearts]);

  // Client-side countdown
  useEffect(() => {
    if (!nextHeartAt || stats.hearts >= 5) {
      setCountdown("");
      return;
    }

    function tick() {
      const diff = new Date(nextHeartAt!).getTime() - Date.now();
      if (diff <= 0) {
        fetch("/api/user/hearts")
          .then(r => r.json())
          .then(data => {
            setStats(s => ({ ...s, hearts: data.hearts }));
            setNextHeartAt(data.nextHeartAt ?? null);
          })
          .catch(() => {});
        setCountdown("");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextHeartAt, stats.hearts]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-card-border"
    >
      <div className="max-w-[480px] mx-auto flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Kotoka" width={28} height={28} className="rounded-lg" />
          <span className="font-heading font-extrabold text-dark text-sm">Kotoka</span>
          {stats.cefrLevel && (
            <motion.div
              key={stats.cefrLevel}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-indigo-100 px-2 py-0.5 rounded-full"
            >
              <Award className="w-3 h-3 text-purple-600" />
              <span className="text-[10px] font-heading font-bold text-purple-700">{stats.cefrLevel}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <motion.div className="flex items-center gap-1" whileHover={{ scale: 1.05 }}>
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span className="text-xs font-body font-medium text-dark">{stats.hearts}</span>
            {stats.hearts <= 4 && countdown && (
              <span className="text-[10px] font-body text-gray-400">· {countdown}</span>
            )}
          </motion.div>

          <motion.div className="flex items-center gap-1" whileHover={{ scale: 1.05 }}>
            <Flame className="w-4 h-4 text-orange" />
            <span className="text-xs font-body font-medium text-dark">{stats.streak}</span>
          </motion.div>

          <motion.div className="flex items-center gap-1" whileHover={{ scale: 1.05 }}>
            <Coins className="w-4 h-4 text-gold" />
            <span className="text-xs font-body font-medium text-dark">{stats.coins}</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
