"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import SettingsSheet from "@/components/SettingsSheet";

interface TopBarUser {
  name: string | null;
  image: string | null;
}

/**
 * Replaces the old gamification StatusBar (hearts/streak/coins/CEFR — hidden,
 * not deleted) with logo left + avatar chip right. Tapping the avatar opens
 * the settings sheet. Renders on every page, including pre-auth ones, where
 * it best-effort falls back to a plain avatar silhouette.
 */
export default function TopBar() {
  const [user, setUser] = useState<TopBarUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setUser({ name: d.name ?? null, image: d.image ?? null });
      })
      .catch(() => {
        /* not authenticated — chip falls back to a placeholder */
      });
    return () => {
      cancelled = true;
    };
  }, [sheetOpen]);

  const avatarIsEmoji = !!user?.image && user.image.length <= 8 && !user.image.startsWith("http") && !user.image.startsWith("/");
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : null;

  return (
    <>
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

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setSheetOpen(true)}
            aria-label="Open settings"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#0fb8c9] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden"
          >
            {avatarIsEmoji ? (
              <span className="text-base leading-none">{user!.image}</span>
            ) : initials ? (
              <span className="font-heading font-extrabold text-xs text-white">{initials}</span>
            ) : (
              <span className="font-heading font-extrabold text-xs text-white">?</span>
            )}
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {sheetOpen && <SettingsSheet onClose={() => setSheetOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
