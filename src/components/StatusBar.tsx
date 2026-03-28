"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Heart, Flame, Coins } from "lucide-react";
import Image from "next/image";

export default function StatusBar() {
  const [stats, setStats] = useState({ hearts: 5, streak: 0, coins: 0 });
  const initialized = useRef(false);

  useEffect(() => {
    async function init() {
      if (initialized.current) return;
      initialized.current = true;

      // Ensure user exists
      await fetch("/api/auth/init", { method: "POST" });

      // Fetch real stats
      const res = await fetch("/api/user");
      if (res.ok) {
        const user = await res.json();
        setStats({ hearts: user.hearts, streak: user.streak, coins: user.coins });
      }
    }

    init();

    const handleUpdate = async () => {
      const res = await fetch("/api/user");
      if (res.ok) {
        const user = await res.json();
        setStats({ hearts: user.hearts, streak: user.streak, coins: user.coins });
      }
    };

    window.addEventListener("kotoka-stats-update", handleUpdate);
    return () => window.removeEventListener("kotoka-stats-update", handleUpdate);
  }, []);

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
        </div>

        <div className="flex items-center gap-4">
          <motion.div
            className="flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
          >
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span className="text-xs font-body font-medium text-dark">{stats.hearts}</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
          >
            <Flame className="w-4 h-4 text-orange" />
            <span className="text-xs font-body font-medium text-dark">{stats.streak}</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
          >
            <Coins className="w-4 h-4 text-gold" />
            <span className="text-xs font-body font-medium text-dark">{stats.coins}</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
