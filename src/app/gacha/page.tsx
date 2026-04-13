"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Coins, BookOpen } from "lucide-react";
import Link from "next/link";
import type { UserData, GachaItemData, DeckWithWords } from "@/types";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { useLocale } from "@/lib/i18n";

const RARITY_CFG: Record<string, { pill: string; border: string; glow: string }> = {
  legendary: {
    pill: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white",
    border: "border-yellow-400",
    glow: "shadow-[0_0_28px_rgba(245,200,66,0.55)]",
  },
  epic: {
    pill: "bg-purple-500 text-white",
    border: "border-purple-400",
    glow: "shadow-[0_0_28px_rgba(168,85,247,0.5)]",
  },
  rare: {
    pill: "bg-blue-500 text-white",
    border: "border-blue-400",
    glow: "shadow-[0_0_28px_rgba(59,130,246,0.45)]",
  },
  common: { pill: "bg-gray-400 text-white", border: "border-gray-200", glow: "" },
};

// ── 3D Holographic Parallax Tilt Card ──────────────────────────────────────
function HoloCard({ children, active }: { children: React.ReactNode; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * 22, y: (px - 0.5) * -22 });
    setGlare({ x: px * 100, y: py * 100 });
  };

  if (!active) return <div className="w-full">{children}</div>;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setTilt({ x: 0, y: 0 }); }}
      animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: hovering ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className="w-full relative"
    >
      {/* Rainbow shimmer layer */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-10 holo-shimmer"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,0,128,0.14), rgba(0,200,255,0.14), rgba(128,0,255,0.14), rgba(255,200,0,0.14))",
          backgroundSize: "400% 400%",
          mixBlendMode: "overlay",
        }}
      />
      {/* Glare */}
      {hovering && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-20"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.55) 0%, transparent 55%)`,
            mixBlendMode: "color-dodge",
          }}
        />
      )}
      <div className="relative z-0">{children}</div>
    </motion.div>
  );
}

// ── Single Gacha Machine ───────────────────────────────────────────────────
type MachineTheme = { bg: string; accentClass: string; borderClass: string; btnClass: string };
type DrawResult = { item: GachaItemData; deck?: DeckWithWords };

function GachaMachine({
  machineType, title, price, description, idleEmoji, theme, user, onDraw,
}: {
  machineType: "luggage" | "vocab_pack";
  title: string;
  price: number;
  description: string;
  idleEmoji: string;
  theme: MachineTheme;
  user: UserData;
  onDraw: (type: "luggage" | "vocab_pack") => Promise<DrawResult>;
}) {
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const canDraw = user.coins >= price;
  const { play } = useSoundPlayer();

  async function handleDraw() {
    if (pulling || !canDraw) return;
    play("click");
    setPulling(true);
    setResult(null);
    try {
      const data = await onDraw(machineType);
      // Vocab pack needs extra time for Gemini
      await new Promise((r) => setTimeout(r, machineType === "vocab_pack" ? 500 : 400));
      setResult(data);
      play("fanfare");
    } finally {
      setPulling(false);
    }
  }

  const rc = result ? (RARITY_CFG[result.item.rarity] ?? RARITY_CFG.common) : null;
  const showHolo =
    machineType === "vocab_pack" ||
    result?.item.rarity === "rare" ||
    result?.item.rarity === "epic" ||
    result?.item.rarity === "legendary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border-2 ${theme.borderClass} overflow-hidden`}
      style={{ background: theme.bg }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-base text-dark">{title}</h2>
          <p className="font-body text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-heading font-extrabold ${theme.accentClass}`}>
          {price}c
        </span>
      </div>

      {/* Body */}
      <div className="px-5 pb-5">
        <AnimatePresence mode="wait">
          {/* Idle */}
          {!pulling && !result && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-5">
              <motion.div
                animate={
                  machineType === "vocab_pack"
                    ? { y: [0, -8, 0], rotate: [-3, 3, -3] }
                    : { y: [0, -8, 0] }
                }
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl select-none"
              >
                {idleEmoji}
              </motion.div>
              <motion.button
                whileHover={canDraw ? { scale: 1.03, y: -2 } : {}}
                whileTap={canDraw ? { scale: 0.96 } : {}}
                onClick={handleDraw}
                disabled={!canDraw}
                className={`w-full py-3.5 rounded-2xl font-heading font-extrabold text-sm transition-all ${
                  canDraw ? theme.btnClass : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {canDraw ? `✨ Draw · ${price}c` : `Need ${price - user.coins}c more`}
              </motion.button>
            </motion.div>
          )}

          {/* Pulling */}
          {pulling && (
            <motion.div key="pulling" initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-3">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.25, 1] }}
                transition={{
                  rotate: { duration: 0.7, repeat: Infinity, ease: "linear" },
                  scale: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
                }}
                className="text-6xl"
              >
                {idleEmoji}
              </motion.div>
              {machineType === "vocab_pack" && (
                <p className="font-body text-xs text-gray-400 animate-pulse">
                  Koko is crafting your words…
                </p>
              )}
            </motion.div>
          )}

          {/* Result */}
          {!pulling && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
              exit={{ opacity: 0 }} className="space-y-3 pt-2">
              <HoloCard active={!!showHolo}>
                <div className={`rounded-2xl border-2 bg-white ${rc?.border} ${rc?.glow} p-5 flex flex-col items-center gap-3`}>
                  <span className={`text-[10px] font-heading font-extrabold px-2.5 py-1 rounded-full ${rc?.pill}`}>
                    {result.item.rarity.toUpperCase()}
                  </span>
                  <div className="text-5xl">{result.item.emoji}</div>
                  <p className="font-heading font-extrabold text-lg text-dark text-center leading-tight">
                    {result.item.name}
                  </p>
                  {result.deck && (
                    <div className="w-full bg-background rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <p className="font-heading font-bold text-xs text-dark">
                          {result.deck.words.length} words added to your decks
                        </p>
                      </div>
                      <p className="font-body text-[11px] text-gray-400 pl-5">
                        "{result.deck.sceneDesc}"
                      </p>
                    </div>
                  )}
                </div>
              </HoloCard>

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDraw}
                  disabled={!canDraw || pulling}
                  className="flex-1 py-3 rounded-2xl border-[1.5px] border-card-border bg-white font-heading font-bold text-sm text-dark disabled:opacity-40"
                >
                  Draw Again
                </motion.button>
                {/* play("click") is already fired inside handleDraw */}
                {result.deck ? (
                  <Link
                    href={`/review?deck=${result.deck.id}`}
                    className="flex-1 py-3 rounded-2xl btn-aqua text-center font-heading font-extrabold text-sm"
                  >
                    Review →
                  </Link>
                ) : (
                  <Link
                    href="/luggage"
                    className="flex-1 py-3 rounded-2xl btn-gold text-center font-heading font-extrabold text-sm"
                  >
                    View 🧳
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function GachaPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUser(d));
  }, []);

  async function handleDraw(type: "luggage" | "vocab_pack"): Promise<DrawResult> {
    const res = await fetch("/api/gacha/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error("Draw failed");
    const data = await res.json();
    setUser(data.user);
    window.dispatchEvent(new Event("kotoka-stats-update"));
    return { item: data.item, deck: data.deck };
  }

  const { play: playPage } = useSoundPlayer();

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="text-4xl">✨</motion.div>
    </div>
  );

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => { playPage("click"); router.back(); }}
          className="flex items-center gap-1 text-gray-500 hover:text-dark transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-body text-sm">{t.back}</span>
        </button>
        <motion.div
          key={user.coins}
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 bg-white rounded-pill px-3 py-1.5 border border-card-border shadow-card"
        >
          <Coins className="w-4 h-4 text-gold" />
          <span className="font-heading font-bold text-sm text-dark">{user.coins}</span>
        </motion.div>
      </div>

      <div>
        <h1 className="font-heading font-extrabold text-xl text-dark">{t.gachaTitle}</h1>
        <p className="font-body text-sm text-gray-500">{t.gachaSubtitle}</p>
      </div>

      {/* Machine 1 — Luggage Draw */}
      <GachaMachine
        machineType="luggage"
        title="🧳 Luggage Draw"
        price={100}
        description="Pure RNG · Travel collectibles"
        idleEmoji="🧳"
        theme={{
          bg: "linear-gradient(135deg, #faf5ff, #f3e8ff)",
          accentClass: "bg-purple-100 text-purple-700",
          borderClass: "border-purple-200",
          btnClass: "btn-gold",
        }}
        user={user}
        onDraw={handleDraw}
      />

      {/* Machine 2 — Vocab Pack */}
      <GachaMachine
        machineType="vocab_pack"
        title="📚 Vocab Pack"
        price={80}
        description="AI-crafted · Generates a new deck"
        idleEmoji="📚"
        theme={{
          bg: "linear-gradient(135deg, #f0fdfe, #e0f9fb)",
          accentClass: "bg-primary/10 text-primary",
          borderClass: "border-primary/30",
          btnClass: "btn-aqua",
        }}
        user={user}
        onDraw={handleDraw}
      />
    </div>
  );
}
