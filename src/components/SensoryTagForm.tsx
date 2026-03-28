"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Sparkles } from "lucide-react";
import { cn, emotionToColor } from "@/lib/utils";
import type { Atmosphere, AmbientSound } from "@/types";

const atmosphereOptions: { value: Atmosphere; emoji: string; label: string }[] = [
  { value: "quiet", emoji: "\u{1F92B}", label: "Quiet" },
  { value: "ambient", emoji: "\u2615", label: "Ambient" },
  { value: "noisy", emoji: "\u{1F50A}", label: "Noisy" },
  { value: "energizing", emoji: "\u2728", label: "Energizing" },
];

const soundOptions: { value: AmbientSound; emoji: string; label: string }[] = [
  { value: "city", emoji: "\u{1F3D9}\uFE0F", label: "City/Urban" },
  { value: "office", emoji: "\u{1F4BC}", label: "Office/Work" },
  { value: "rain", emoji: "\u{1F327}\uFE0F", label: "Rain/Nature" },
  { value: "cafe", emoji: "\u2615", label: "Caf\u00E9" },
  { value: "transit", emoji: "\u{1F687}", label: "Transit/BTS" },
];

interface SensoryTagFormProps {
  onSave: (data: {
    emotionScore: number;
    atmosphere: Atmosphere;
    ambientSound: AmbientSound;
    note: string;
    colorPalette: string;
  }) => void;
  loading?: boolean;
}

export default function SensoryTagForm({ onSave, loading }: SensoryTagFormProps) {
  const [emotionScore, setEmotionScore] = useState(50);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("ambient");
  const [ambientSound, setAmbientSound] = useState<AmbientSound>("cafe");
  const [note, setNote] = useState("");

  const bgColor = emotionToColor(emotionScore);

  const handleSubmit = () => {
    onSave({
      emotionScore,
      atmosphere,
      ambientSound,
      note,
      colorPalette: bgColor,
    });
  };

  return (
    <div className="space-y-6">
      {/* Color preview bar */}
      <motion.div
        className="h-2 rounded-full transition-all duration-500"
        style={{ backgroundColor: bgColor }}
        animate={{ backgroundColor: bgColor }}
      />

      {/* Emotion Slider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-card border-[1.5px] border-card-border shadow-card p-4"
      >
        <h3 className="font-heading font-extrabold text-dark text-sm mb-3">
          How do you feel?
        </h3>
        <div className="flex items-center justify-between text-xs font-body text-gray-500 mb-2">
          <span>Calm 😌</span>
          <span>Energized ⚡</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={emotionScore}
          onChange={(e) => setEmotionScore(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, #93c5fd ${emotionScore}%, #e5e7eb ${emotionScore}%)`,
          }}
        />
        <div className="text-center mt-1">
          <span
            className="inline-block text-xs font-body font-medium px-3 py-1 rounded-full"
            style={{ backgroundColor: bgColor, color: "white" }}
          >
            {emotionScore}
          </span>
        </div>
      </motion.div>

      {/* Atmosphere Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-card border-[1.5px] border-card-border shadow-card p-4"
      >
        <h3 className="font-heading font-extrabold text-dark text-sm mb-3">
          Atmosphere
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {atmosphereOptions.map((opt) => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAtmosphere(opt.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border-[1.5px] transition-all duration-200 text-left",
                atmosphere === opt.value
                  ? "border-primary bg-primary/5 shadow-btn-aqua/20"
                  : "border-card-border bg-white hover:border-primary/30"
              )}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs font-body font-medium text-dark">
                {opt.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Ambient Sound Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-card border-[1.5px] border-card-border shadow-card p-4"
      >
        <h3 className="font-heading font-extrabold text-dark text-sm mb-3">
          Ambient Sound
        </h3>
        <div className="flex flex-wrap gap-2">
          {soundOptions.map((opt) => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAmbientSound(opt.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full border-[1.5px] transition-all duration-200",
                ambientSound === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-card-border bg-white hover:border-primary/30"
              )}
            >
              <span className="text-sm">{opt.emoji}</span>
              <span className="text-[11px] font-body font-medium text-dark">
                {opt.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Personal Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-card border-[1.5px] border-card-border shadow-card p-4"
      >
        <h3 className="font-heading font-extrabold text-dark text-sm mb-3">
          Personal Note <span className="font-normal text-gray-400">(optional)</span>
        </h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 120))}
          placeholder="How does this moment feel?"
          maxLength={120}
          rows={2}
          className="w-full text-sm font-body text-dark bg-background border border-card-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <p className="text-[10px] font-body text-gray-400 text-right mt-1">
          {note.length}/120
        </p>
      </motion.div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-heading font-extrabold text-sm text-white transition-all duration-200",
          "bg-gradient-to-r from-primary to-primary-dark shadow-btn-aqua",
          loading && "opacity-60 cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="save"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Deck
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
