"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MapPin, Cloud, Camera, Music, Volume2, ArrowRight, Check, Bot, Loader2 } from "lucide-react";
import KokoMascot from "@/components/KokoMascot";
import type { SnapResponse } from "@/types";
import type { AutoTagResult } from "@/lib/autoSensoryTag";
import { getSoundForTags, SOUND_LIBRARY } from "@/lib/ambientSounds";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { useLocale } from "@/lib/i18n";

export default function TagPage() {
  const router = useRouter();
  const { play } = useSoundPlayer();
  const { t } = useLocale();
  const [snapData, setSnapData] = useState<SnapResponse | null>(null);
  const [autoTag, setAutoTag] = useState<AutoTagResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);

  const EMOTIONS = [
    { id: "happy", emoji: "😊" },
    { id: "focused", emoji: "🎯" },
    { id: "relaxed", emoji: "😌" },
    { id: "excited", emoji: "🤩" },
    { id: "curious", emoji: "🤔" },
    { id: "nervous", emoji: "😰" },
    { id: "stressed", emoji: "😤" },
  ];

  // Derive current sound from selected emotion + atmosphere
  const currentSound = autoTag
    ? selectedEmotion
      ? getSoundForTags(selectedEmotion, autoTag.atmosphereTag)
      : SOUND_LIBRARY[autoTag.soundId]
    : null;

  useEffect(() => {
    const raw = sessionStorage.getItem("kotoka-snap-result");
    if (!raw) { router.replace("/snap"); return; }
    const snap = JSON.parse(raw) as SnapResponse;
    setSnapData(snap);

    const thumbnail = sessionStorage.getItem("kotoka-snap-thumbnail");

    // Ask for location with a hard 3s timeout.
    // Success, denial, timeout, and no-geolocation all proceed to POST.
    const getCoords = (): Promise<{ lat: number; lng: number } | null> =>
      new Promise((resolve) => {
        if (!("geolocation" in navigator)) return resolve(null);
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) { settled = true; resolve(null); }
        }, 3000);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(null); // denial or error — Gemini fallback fires server-side
          },
          { timeout: 3000, maximumAge: 5 * 60 * 1000 },
        );
      });

    getCoords().then((coords) => {
      const body: Record<string, unknown> = { scene_context: snap.scene };
      if (coords) { body.lat = coords.lat; body.lng = coords.lng; }
      if (thumbnail) body.image = thumbnail;

      return fetch("/api/tag/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    })
      .then((r) => r!.json())
      .then((data) => setAutoTag(data as AutoTagResult))
      .catch(() => {
        setAutoTag({
          emotionTag: "focused",
          atmosphereTag: "office",
          compoundTag: "focused + office",
          soundId: "S01",
          soundName: "Office Hum",
          soundEmoji: "💼",
          weatherRaw: { condition: "clear sky", temp: 28 },
          gpsZone: "office",
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handlePreviewSound = () => {
    play("click");
    setPreviewPlaying(p => !p);
  };

  const handleSave = async () => {
    if (!snapData || saving) return;
    play("unlock");
    setSaving(true);
    try {
      // FIX 6: attach compressed thumbnail if available
      const thumbnail = sessionStorage.getItem("kotoka-snap-thumbnail");
      await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneDesc: snapData.scene,
          emotionScore: 60,
          atmosphere: autoTag?.atmosphereTag ?? "ambient",
          ambientSound: currentSound?.id ?? autoTag?.soundId ?? "S01",
          colorPalette: "#1ad3e2",
          vocabulary: snapData.vocabulary,
          imageBase64: thumbnail ?? undefined,
        }),
      });
      sessionStorage.removeItem("kotoka-snap-result");
      sessionStorage.removeItem("kotoka-snap-thumbnail");
      setSaved(true);
      setTimeout(() => router.push("/review"), 1200);
    } catch {
      setSaving(false);
    }
  };

  if (!snapData) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-[480px] mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-primary" />
            <h1 className="font-heading font-extrabold text-xl text-dark">{t.tagTitle}</h1>
          </div>
          <p className="font-body text-sm text-gray-500">{t.tagSubtitle}</p>
        </motion.div>

        {loading ? (
          <div className="card-base p-8 flex flex-col items-center gap-3">
            <KokoMascot state="thinking" className="w-24 h-24" />
            <p className="font-body text-sm text-gray-500">Koko is reading your context...</p>
          </div>
        ) : (
          <AnimatePresence>
            {autoTag && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-4"
              >
                {/* Context signals */}
                <div className="card-base p-4 space-y-3">
                  <p className="font-heading font-bold text-sm text-dark">{t.tagContextDetected}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-gray-400">{t.tagGpsZone}</p>
                        <p className="font-heading font-bold text-sm text-dark capitalize">{autoTag.gpsZone ?? "detecting..."}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                        <Cloud className="w-4 h-4 text-sky-500" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-gray-400">{t.tagWeather}</p>
                        <p className="font-heading font-bold text-sm text-dark capitalize">
                          {autoTag.weatherRaw?.condition} · {autoTag.weatherRaw?.temp}°C
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-gray-400">{t.tagScene}</p>
                        <p className="font-heading font-bold text-sm text-dark capitalize">{snapData.scene}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emotion picker */}
                <div className="card-base p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-bold text-sm text-dark">How are you feeling?</p>
                    {!selectedEmotion && (
                      <span className="font-body text-xs text-orange-400">Pick a mood</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {EMOTIONS.map(({ id, emoji }) => (
                      <motion.button
                        key={id}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setSelectedEmotion(id)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 transition-all ${
                          selectedEmotion === id
                            ? "border-primary bg-primary/10"
                            : "border-card-border bg-white hover:border-primary/40"
                        }`}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className={`font-body text-[10px] font-semibold capitalize ${selectedEmotion === id ? "text-primary" : "text-gray-500"}`}>{id}</span>
                      </motion.button>
                    ))}
                  </div>
                  {selectedEmotion && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 bg-primary/10 rounded-xl px-3 py-2 text-center">
                        <p className="font-body text-xs text-gray-500">Mood</p>
                        <p className="font-heading font-bold text-sm text-primary capitalize">{selectedEmotion}</p>
                      </div>
                      <span className="font-body text-gray-400">+</span>
                      <div className="flex-1 bg-primary/10 rounded-xl px-3 py-2 text-center">
                        <p className="font-body text-xs text-gray-500">Place</p>
                        <p className="font-heading font-bold text-sm text-primary capitalize">{autoTag.atmosphereTag}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sound assignment */}
                <div className="card-base p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                        {currentSound?.emoji ?? autoTag.soundEmoji}
                      </div>
                      <div>
                        <p className="font-body text-xs text-gray-400">{t.tagSoundAssigned}</p>
                        <p className="font-heading font-bold text-sm text-dark">{currentSound?.name ?? autoTag.soundName}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePreviewSound}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 rounded-xl text-primary font-heading font-bold text-xs"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {t.tagPreview}
                    </motion.button>
                  </div>
                </div>

                {/* Words preview */}
                <div className="card-base p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-bold text-sm text-dark">{t.tagWordsToSave}</p>
                    <span className="font-body text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{snapData.vocabulary.length} words</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {snapData.vocabulary.slice(0, 6).map((v, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-full font-body text-xs text-dark">
                        {v.word}
                      </span>
                    ))}
                    {snapData.vocabulary.length > 6 && (
                      <span className="px-2.5 py-1 bg-gray-100 rounded-full font-body text-xs text-gray-500">
                        +{snapData.vocabulary.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Save button */}
                <motion.button
                  whileHover={!saving && !saved ? { scale: 1.02, y: -1 } : {}}
                  whileTap={!saving && !saved ? { scale: 0.97 } : {}}
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="btn-aqua w-full py-4 text-base disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  <AnimatePresence mode="wait">
                    {saved ? (
                      <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" /> {t.tagSaved}
                      </motion.span>
                    ) : saving ? (
                      <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> {t.tagSaving}
                      </motion.span>
                    ) : (
                      <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                        {t.tagSaveWords} <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
