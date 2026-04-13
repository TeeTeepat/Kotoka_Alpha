"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Heart, Flame, Coins, Target, Trophy, ChevronRight, MapPin,
} from "lucide-react";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import type { GachaItemData } from "@/types";
import { useLocale } from "@/lib/i18n";

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

// ─── Mini Memory Map ──────────────────────────────────────────────────────────
interface MapPin { id: string; locationName: string; colorPalette: string; locationLat: number; locationLng: number; words: { id: string; word: string }[]; }

const DEMO_MAP_PINS: MapPin[] = [
  { id: "d1", locationName: "Siam BTS", colorPalette: "#1ad3e2", locationLat: 13.7460, locationLng: 100.5331, words: [{ id: "w1", word: "escalator" }] },
  { id: "d2", locationName: "Asok", colorPalette: "#f59e0b", locationLat: 13.7375, locationLng: 100.5601, words: [{ id: "w2", word: "street food" }] },
  { id: "d3", locationName: "Lumpini", colorPalette: "#10b981", locationLat: 13.7282, locationLng: 100.5418, words: [{ id: "w3", word: "fountain" }] },
];

function projectPin(lat: number, lng: number, pins: MapPin[]) {
  const lats = pins.map(p => p.locationLat), lngs = pins.map(p => p.locationLng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.25, 0.005);
  const padLng = Math.max((maxLng - minLng) * 0.25, 0.005);
  const x = 0.1 + ((lng - (minLng - padLng)) / ((maxLng + padLng) - (minLng - padLng))) * 0.8;
  const y = 0.1 + (((maxLat + padLat) - lat) / ((maxLat + padLat) - (minLat - padLat))) * 0.8;
  return { x: x * 100, y: y * 100 };
}

function MiniMemoryMap({ pins }: { pins: MapPin[] }) {
  const activePins = pins.length > 0 ? pins : DEMO_MAP_PINS;
  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-extrabold text-base text-dark">Memory Map</h2>
        </div>
        <Link href="/memory-map" className="flex items-center gap-1 text-xs font-body text-primary">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {pins.length === 0 && (
        <p className="font-body text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-1.5">
          Demo — snap a photo to mark real locations
        </p>
      )}

      <div className="relative w-full rounded-2xl overflow-hidden border border-card-border" style={{ height: 140 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-teal-50/70 to-emerald-50" />
        {[25, 50, 75].map(p => (
          <div key={`h${p}`} className="absolute inset-x-0 border-t border-primary/10" style={{ top: `${p}%` }} />
        ))}
        {[25, 50, 75].map(p => (
          <div key={`v${p}`} className="absolute inset-y-0 border-l border-primary/10" style={{ left: `${p}%` }} />
        ))}
        {activePins.slice(0, 8).map((pin, i) => {
          const { x, y } = projectPin(pin.locationLat, pin.locationLng, activePins);
          return (
            <motion.div key={pin.id}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 20 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  style={{ backgroundColor: pin.colorPalette }}>
                  <span className="text-[7px] text-white font-bold">{pin.words.length}</span>
                </div>
                <div className="bg-white/90 rounded px-1 py-0.5 shadow-sm">
                  <span className="text-[7px] font-heading font-bold text-dark whitespace-nowrap">{pin.locationName}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="font-body text-xs text-gray-400 text-center">
        {activePins.length} memor{activePins.length === 1 ? "y" : "ies"} on the map
      </p>
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
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/user").then((r) => r.ok ? r.json() : null).then((d) => d && setUser(d));
    fetch("/api/gacha/items").then((r) => r.ok ? r.json() : []).then(setItems);
    fetch("/api/decks").then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) && setDecksCount(d.length));
    fetch("/api/memory-map").then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) && setMapPins(d));
  }, []);

  const { play } = useSoundPlayer();
  const { t } = useLocale();
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
            <span className="font-body text-[10px] text-gray-400">{t.profileStreak}</span>
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

      {/* Luggage card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <LuggageCard items={items} />
      </motion.div>

      {/* Mini Memory Map */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
        <MiniMemoryMap pins={mapPins} />
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
          onClick={() => { play("click"); setShowLogoutConfirm(true); }}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-heading font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-60"
        >
          {loggingOut ? (
            <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {loggingOut ? t.loading : t.profileLogout}
        </motion.button>
      </motion.div>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowLogoutConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="font-heading font-extrabold text-lg text-dark">Log Out?</h2>
                <p className="font-body text-sm text-gray-500">Are you sure you want to log out of Kotoka?</p>
              </div>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border border-card-border font-heading font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  {t.cancel}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleLogout} disabled={loggingOut}
                  className="flex-1 py-3 rounded-2xl bg-red-500 font-heading font-bold text-sm text-white hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loggingOut && <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-white rounded-full animate-spin" />}
                  {loggingOut ? t.loading : t.profileLogout}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
