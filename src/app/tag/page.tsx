"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Smile, Zap, Wind, Coffee, Volume2, Train, Sun, ArrowRight, Check } from "lucide-react";
import type { SnapResponse, Atmosphere, AmbientSound } from "@/types";
import { cn } from "@/lib/utils";

const ATMOSPHERES: { value: Atmosphere; label: string; icon: React.ReactNode }[] = [
  { value: "quiet",      label: "Quiet",      icon: <Wind className="w-4 h-4" /> },
  { value: "ambient",    label: "Ambient",    icon: <Coffee className="w-4 h-4" /> },
  { value: "noisy",      label: "Noisy",      icon: <Volume2 className="w-4 h-4" /> },
  { value: "energizing", label: "Energizing", icon: <Zap className="w-4 h-4" /> },
];

const SOUNDS: { value: AmbientSound; label: string; emoji: string }[] = [
  { value: "city",    label: "City",    emoji: "🏙️" },
  { value: "office",  label: "Office",  emoji: "💼" },
  { value: "rain",    label: "Rain",    emoji: "🌧️" },
  { value: "cafe",    label: "Café",    emoji: "☕" },
  { value: "transit", label: "BTS/MRT", emoji: "🚇" },
];

function emotionToColors(score: number): { bg: string; accent: string; text: string } {
  if (score < 25)  return { bg: "#e8f6fd", accent: "#7bc8e2", text: "Calm & Peaceful" };
  if (score < 50)  return { bg: "#edf7f0", accent: "#1ad3e2", text: "Relaxed & Focused" };
  if (score < 75)  return { bg: "#fef9ec", accent: "#f5c842", text: "Alert & Engaged" };
  return           { bg: "#fff2e8", accent: "#ff8c42", text: "Energized & Motivated" };
}

export default function TagPage() {
  const router = useRouter();
  const [snapData, setSnapData] = useState<SnapResponse | null>(null);
  const [emotion, setEmotion]       = useState(50);
  const [atmosphere, setAtmo]       = useState<Atmosphere>("ambient");
  const [sound, setSound]           = useState<AmbientSound>("cafe");
  const [note, setNote]             = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("kotoka-snap-result");
    if (!raw) { router.replace("/snap"); return; }
    setSnapData(JSON.parse(raw));
  }, [router]);

  const colors = useMemo(() => emotionToColors(emotion), [emotion]);

  const handleSave = async () => {
    if (!snapData || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneDesc:    snapData.scene,
          emotionScore: emotion,
          atmosphere,
          ambientSound: sound,
          note:         note.trim() || null,
          colorPalette: colors.accent,
          vocabulary:   snapData.vocabulary,
        }),
      });
      if (!res.ok) throw new Error("Save failed");

      // Award coins
      const stats = JSON.parse(localStorage.getItem("kotoka-stats") || '{"hearts":5,"streak":0,"coins":0,"wordsLearned":0}');
      stats.coins += 1 + (snapData.vocabulary.length > 5 ? 1 : 0);
      stats.wordsLearned += snapData.vocabulary.length;
      localStorage.setItem("kotoka-stats", JSON.stringify(stats));
      window.dispatchEvent(new Event("kotoka-stats-update"));

      sessionStorage.removeItem("kotoka-snap-result");
      setSaved(true);
      setTimeout(() => router.push("/review"), 1200);
    } catch {
      setSaving(false);
    }
  };

  if (!snapData) return null;

  return (
    <motion.div
      style={{ backgroundColor: colors.bg }}
      animate={{ backgroundColor: colors.bg }}
      transition={{ duration: 0.6 }}
      className="min-h-screen -mx-4 px-4 py-4 transition-colors"
    >
      <div className="space-y-5 max-w-[480px]">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading font-extrabold text-xl text-dark">Sensory Tag</h1>
          <p className="font-body text-sm text-gray-500">
            How do you feel right now? This anchors your memory.
          </p>
        </motion.div>

        {/* Scene Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card-base px-4 py-3 flex items-center gap-3"
        >
          <span className="text-lg">📍</span>
          <div>
            <p className="font-body text-xs text-gray-400">Scene</p>
            <p className="font-heading font-extrabold text-sm text-dark capitalize">{snapData.scene}</p>
          </div>
          <span className="ml-auto text-xs font-body font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {snapData.vocabulary.length} words
          </span>
        </motion.div>

        {/* Emotion Slider */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card-base p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="font-heading font-extrabold text-sm text-dark">Emotional State</p>
            <motion.span
              key={colors.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-body font-medium px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: colors.accent }}
            >
              {colors.text}
            </motion.span>
          </div>

          <div className="flex items-center gap-3">
            <Smile className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <input
              type="range" min={0} max={100} value={emotion}
              onChange={e => setEmotion(Number(e.target.value))}
              className="flex-1"
              style={{ background: `linear-gradient(to right, ${colors.accent} ${emotion}%, #e2ecf0 ${emotion}%)` }}
            />
            <Zap className="w-5 h-5 text-orange-400 flex-shrink-0" />
          </div>
        </motion.div>

        {/* Atmosphere */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card-base p-4 space-y-3"
        >
          <p className="font-heading font-extrabold text-sm text-dark">Atmosphere</p>
          <div className="grid grid-cols-4 gap-2">
            {ATMOSPHERES.map(({ value, label, icon }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                onClick={() => setAtmo(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-2xl border-[1.5px] transition-all font-heading font-extrabold text-xs",
                  atmosphere === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-card-border bg-white text-gray-500 hover:border-primary/30"
                )}
              >
                {icon}
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Ambient Sound */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card-base p-4 space-y-3"
        >
          <p className="font-heading font-extrabold text-sm text-dark">Ambient Sound</p>
          <div className="grid grid-cols-5 gap-2">
            {SOUNDS.map(({ value, label, emoji }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }}
                onClick={() => setSound(value)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-2xl border-[1.5px] transition-all",
                  sound === value
                    ? "border-primary bg-primary/10"
                    : "border-card-border bg-white hover:border-primary/30"
                )}
              >
                <span className="text-xl leading-none">{emoji}</span>
                <span className={cn("text-[10px] font-heading font-extrabold",
                  sound === value ? "text-primary" : "text-gray-500"
                )}>{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card-base p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="font-heading font-extrabold text-sm text-dark">Personal Note <span className="text-gray-400 font-body font-normal">(optional)</span></p>
            <span className="text-xs font-body text-gray-400">{note.length}/120</span>
          </div>
          <textarea
            value={note} onChange={e => setNote(e.target.value.slice(0, 120))}
            placeholder="e.g. Waiting for 9am standup, feeling focused..."
            rows={2}
            className="w-full resize-none font-body text-sm text-dark placeholder:text-gray-300 bg-background rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="pb-4"
        >
          <motion.button
            whileHover={!saving && !saved ? { scale: 1.02, y: -1 } : {}}
            whileTap={!saving && !saved ? { scale: 0.97 } : {}}
            onClick={handleSave}
            disabled={saving || saved}
            className={cn("btn-aqua w-full py-4 text-base", (saving || saved) && "opacity-80 cursor-not-allowed")}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> Deck Saved!
                </motion.span>
              ) : saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Sun className="w-4 h-4" />
                  </motion.div>
                  Saving...
                </motion.span>
              ) : (
                <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2">
                  Save Deck <ArrowRight className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

      </div>
    </motion.div>
  );
}
