"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Heart, Flame, Coins, Target, Trophy, Globe, ChevronRight,
} from "lucide-react";
import type { GachaItemData } from "@/types";

const RARITY_PILL: Record<string, string> = {
  legendary: "bg-yellow-100 text-yellow-700",
  epic: "bg-purple-100 text-purple-700",
  rare: "bg-blue-100 text-blue-700",
  common: "bg-gray-100 text-gray-500",
};

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "Profile"}
        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
      />
    );
  }
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#0fb8c9] border-4 border-white shadow-lg flex items-center justify-center">
      <span className="font-heading font-extrabold text-2xl text-white">{initials}</span>
    </div>
  );
}

// ─── Compact Luggage Card ──────────────────────────────────────────────────────
function LuggageCard({ items }: { items: GachaItemData[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-extrabold text-base text-dark">🧳 My Luggage</h2>
        <Link href="/luggage" className="flex items-center gap-1 text-xs font-body text-primary">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-3xl mb-2">🧳</p>
          <p className="font-body text-sm text-gray-400">No items yet — do a gacha draw!</p>
          <Link href="/shop" className="btn-aqua px-4 py-2 inline-flex mt-3 text-sm">Go to Shop</Link>
        </div>
      ) : (
        <>
          {/* Mini luggage toggle */}
          <button
            onClick={() => setIsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-accent-lavender/20 border border-[#C8B8E8]"
          >
            <span className="font-body text-sm text-[#6B5A94] font-medium">
              {items.length} items collected
            </span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-[#6B5A94]"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {items.slice(0, 10).map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-xl bg-white border border-card-border p-1.5 flex flex-col items-center gap-0.5"
                      title={item.name}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span className={`text-[8px] font-heading font-bold px-1 py-0.5 rounded-full ${RARITY_PILL[item.rarity]}`}>
                        {item.rarity[0].toUpperCase()}
                      </span>
                    </motion.div>
                  ))}
                  {items.length > 10 && (
                    <div className="rounded-xl bg-gray-50 border border-card-border p-1.5 flex items-center justify-center">
                      <span className="text-[10px] font-body text-gray-400">+{items.length - 10}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Main Profile Page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<{
    hearts: number; streak: number; coins: number;
    targetLanguage?: string | null; learningLanguage?: string | null; name?: string | null;
  } | null>(null);
  const [items, setItems] = useState<GachaItemData[]>([]);
  const [decksCount, setDecksCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/user").then((r) => r.ok ? r.json() : null).then((d) => d && setUser(d));
    fetch("/api/gacha/items").then((r) => r.ok ? r.json() : []).then(setItems);
    fetch("/api/decks").then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) && setDecksCount(d.length));
  }, []);

  const displayName = session?.user?.name ?? user?.name ?? "Learner";
  const displayEmail = session?.user?.email ?? "";
  const displayImage = session?.user?.image ?? null;

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  // Daily mission: encourage reviewing words
  const missionProgress = Math.min(decksCount, 5);
  const missionGoal = 5;

  return (
    <div className="py-4 space-y-4">
      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-base p-5 flex flex-col items-center gap-3 text-center"
      >
        <Avatar name={displayName} image={displayImage} />
        <div>
          <h1 className="font-heading font-extrabold text-xl text-dark">{displayName}</h1>
          {displayEmail && (
            <p className="font-body text-sm text-gray-400 mt-0.5">{displayEmail}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 pt-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span className="font-heading font-extrabold text-lg text-dark">{user?.hearts ?? 5}</span>
            </div>
            <span className="font-body text-[10px] text-gray-400">Hearts</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange" />
              <span className="font-heading font-extrabold text-lg text-dark">{user?.streak ?? 0}</span>
            </div>
            <span className="font-body text-[10px] text-gray-400">Streak</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-gold" />
              <span className="font-heading font-extrabold text-lg text-dark">{user?.coins ?? 0}</span>
            </div>
            <span className="font-body text-[10px] text-gray-400">Coins</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-heading font-extrabold text-lg text-dark">{items.length}</span>
            </div>
            <span className="font-body text-[10px] text-gray-400">Items</span>
          </div>
        </div>
      </motion.div>

      {/* Mission card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card-base p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-extrabold text-base text-dark">Today&apos;s Mission</h2>
        </div>
        <p className="font-body text-sm text-gray-500">
          Snap &amp; learn from {missionGoal} different scenes today
        </p>
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(missionProgress / missionGoal) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="h-full bg-gradient-to-r from-primary to-[#0fb8c9] rounded-full"
            />
          </div>
          <p className="font-body text-xs text-gray-400 text-right">
            {missionProgress} / {missionGoal} scenes
          </p>
        </div>
        {missionProgress >= missionGoal && (
          <p className="font-body text-sm text-emerald-600 font-medium">🎉 Mission complete for today!</p>
        )}
      </motion.div>

      {/* Language setting */}
      {(user?.targetLanguage || user?.learningLanguage) && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          onClick={() => router.push("/onboarding/language")}
          className="card-base p-4 w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="font-heading font-bold text-sm text-dark">Languages</p>
              <p className="font-body text-xs text-gray-400">
                {user.targetLanguage ?? "—"} → {user.learningLanguage ?? "—"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </motion.button>
      )}

      {/* Luggage card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <LuggageCard items={items} />
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-heading font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-60"
        >
          {loggingOut ? (
            <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {loggingOut ? "Signing out…" : "Log Out"}
        </motion.button>
      </motion.div>
    </div>
  );
}
