"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Footprints, BookOpen } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";

interface MapWord { id: string; word: string; translation: string; masteryCount: number; }
interface MapPin {
  id: string; sceneDesc: string; colorPalette: string;
  locationLat: number; locationLng: number; locationName: string;
  words: MapWord[];
}

const DEMO_PINS: MapPin[] = [
  { id: "d1", locationName: "Siam BTS", sceneDesc: "Shopping mall concourse", colorPalette: "#1ad3e2", locationLat: 13.7460, locationLng: 100.5331, words: [{ id: "w1", word: "escalator", translation: "บันไดเลื่อน", masteryCount: 6 }, { id: "w2", word: "department store", translation: "ห้างสรรพสินค้า", masteryCount: 3 }] },
  { id: "d2", locationName: "Asok Night Market", sceneDesc: "Street food vendors", colorPalette: "#f59e0b", locationLat: 13.7375, locationLng: 100.5601, words: [{ id: "w3", word: "grilled", translation: "ย่าง", masteryCount: 5 }, { id: "w4", word: "spicy", translation: "เผ็ด", masteryCount: 7 }] },
  { id: "d3", locationName: "Lumpini Park", sceneDesc: "Morning jog path", colorPalette: "#10b981", locationLat: 13.7282, locationLng: 100.5418, words: [{ id: "w5", word: "fountain", translation: "น้ำพุ", masteryCount: 2 }, { id: "w6", word: "jogger", translation: "นักวิ่ง", masteryCount: 4 }] },
  { id: "d4", locationName: "Chatuchak Market", sceneDesc: "Weekend market stalls", colorPalette: "#8b5cf6", locationLat: 13.7999, locationLng: 100.5500, words: [{ id: "w7", word: "handcraft", translation: "งานฝีมือ", masteryCount: 1 }, { id: "w8", word: "bargain", translation: "ต่อราคา", masteryCount: 8 }] },
];

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function projectToPercent(lat: number, lng: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const pad = 0.12;
  const x = pad + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * (1 - 2 * pad);
  const y = pad + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1)) * (1 - 2 * pad);
  return { x: x * 100, y: y * 100 };
}

function getBounds(pins: MapPin[]) {
  const lats = pins.map(p => p.locationLat);
  const lngs = pins.map(p => p.locationLng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.2, 0.005);
  const padLng = Math.max((maxLng - minLng) * 0.2, 0.005);
  return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
}

interface Notification { pin: MapPin; word: MapWord; }

export default function MemoryMapPage() {
  const { t } = useLocale();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [simPos, setSimPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const walkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkTargetIdx = useRef(0);

  useEffect(() => {
    fetch("/api/memory-map")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setPins(data);
        else { setPins(DEMO_PINS); setIsDemoMode(true); }
      })
      .catch(() => { setPins(DEMO_PINS); setIsDemoMode(true); })
      .finally(() => setLoading(false));
  }, []);

  const activePins = pins;
  const bounds = activePins.length > 0 ? getBounds(activePins) : getBounds(DEMO_PINS);

  const checkProximity = useCallback((lat: number, lng: number) => {
    for (const pin of activePins) {
      const dist = haversineM(lat, lng, pin.locationLat, pin.locationLng);
      if (dist < 100 && pin.words.length > 0) {
        const word = pin.words[0];
        setNotification({ pin, word });
        if (notifTimer.current) clearTimeout(notifTimer.current);
        notifTimer.current = setTimeout(() => setNotification(null), 4000);
        return;
      }
    }
  }, [activePins]);

  const startWalk = useCallback(() => {
    if (activePins.length === 0) return;
    setIsWalking(true);
    walkTargetIdx.current = 0;
    const startPin = activePins[0];
    setSimPos({ lat: startPin.locationLat - 0.0005, lng: startPin.locationLng - 0.0005 });

    walkRef.current = setInterval(() => {
      const target = activePins[walkTargetIdx.current % activePins.length];
      setSimPos(prev => {
        if (!prev) return { lat: target.locationLat, lng: target.locationLng };
        const dLat = target.locationLat - prev.lat;
        const dLng = target.locationLng - prev.lng;
        const dist = Math.sqrt(dLat ** 2 + dLng ** 2);
        if (dist < 0.0001) {
          walkTargetIdx.current += 1;
          return prev;
        }
        const step = 0.00008;
        const newLat = prev.lat + (dLat / dist) * step;
        const newLng = prev.lng + (dLng / dist) * step;
        checkProximity(newLat, newLng);
        return { lat: newLat, lng: newLng };
      });
    }, 150);
  }, [activePins, checkProximity]);

  const stopWalk = useCallback(() => {
    setIsWalking(false);
    setSimPos(null);
    if (walkRef.current) clearInterval(walkRef.current);
  }, []);

  useEffect(() => () => {
    if (walkRef.current) clearInterval(walkRef.current);
    if (notifTimer.current) clearTimeout(notifTimer.current);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
        <MapPin className="w-8 h-8 text-primary" />
      </motion.div>
    </div>
  );

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-dark">{t.memoryMapTitle}</h1>
          <p className="font-body text-xs text-gray-500">
            {isDemoMode ? "Demo mode — snap a photo to mark real memories" : `${activePins.length} memory ${activePins.length === 1 ? "location" : "locations"}`}
          </p>
        </div>
        <Link href="/luggage" className="text-xs font-heading font-bold text-primary px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5">
          🧳 Luggage
        </Link>
      </div>

      {/* Demo badge */}
      {isDemoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-amber-500 text-sm">ℹ️</span>
          <p className="font-body text-xs text-amber-700">Showing demo locations. Snap a photo to create real memory pins.</p>
        </div>
      )}

      {/* Map canvas */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-card border border-card-border" style={{ height: 340 }}>
        {/* Terrain background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-teal-50/80 to-emerald-50" />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[25, 50, 75].map(p => (
            <div key={`h${p}`} className="absolute inset-x-0 border-t border-primary/10" style={{ top: `${p}%` }} />
          ))}
          {[25, 50, 75].map(p => (
            <div key={`v${p}`} className="absolute inset-y-0 border-l border-primary/10" style={{ left: `${p}%` }} />
          ))}
        </div>

        {/* Road lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <line x1="0" y1="60%" x2="100%" y2="55%" stroke="#1ad3e2" strokeWidth="2" strokeDasharray="8,4" />
          <line x1="30%" y1="0" x2="35%" y2="100%" stroke="#1ad3e2" strokeWidth="2" strokeDasharray="8,4" />
          <line x1="0" y1="30%" x2="100%" y2="40%" stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="6,4" />
        </svg>

        {/* Location Pins */}
        {activePins.map(pin => {
          const { x, y } = projectToPercent(pin.locationLat, pin.locationLng, bounds);
          return (
            <motion.button
              key={pin.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPin(pin)}
              className="absolute -translate-x-1/2 -translate-y-full focus:outline-none"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {/* Pin pulse */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full -z-10"
                style={{ backgroundColor: pin.colorPalette + "50", margin: -6 }}
              />
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white"
                  style={{ backgroundColor: pin.colorPalette }}
                >
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                {/* Word count badge */}
                <div className="bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-card-border">
                  <span className="text-[9px] font-heading font-bold text-dark">{pin.words.length}w</span>
                </div>
                {/* Label */}
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-0.5 shadow-sm">
                  <span className="text-[9px] font-heading font-bold text-dark whitespace-nowrap">{pin.locationName}</span>
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* Simulated position */}
        <AnimatePresence>
          {simPos && (() => {
            const { x, y } = projectToPercent(simPos.lat, simPos.lng, bounds);
            return (
              <motion.div
                key="you"
                animate={{ left: `${x}%`, top: `${y}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center"
                >
                  <Navigation className="w-2.5 h-2.5 text-white" />
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Compass */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-card-border flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-heading font-bold text-dark">N</span>
        </div>

        {/* Scale */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-xl px-2 py-1 border border-card-border">
          <div className="w-8 h-0.5 bg-dark" />
          <span className="text-[9px] font-body text-gray-500">~100m</span>
        </div>
      </div>

      {/* Walk controls */}
      <div className="flex gap-3">
        {!isWalking ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startWalk}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-heading font-bold text-sm shadow-card"
          >
            <Footprints className="w-4 h-4" />
            Simulate Walk
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={stopWalk}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-heading font-bold text-sm"
          >
            <X className="w-4 h-4" />
            Stop Walking
          </motion.button>
        )}
      </div>

      {/* Proximity notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card-base p-4 border-l-4 flex items-start gap-3"
            style={{ borderLeftColor: notification.pin.colorPalette }}
          >
            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: notification.pin.colorPalette }} />
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-dark">
                You're near {notification.pin.locationName}
              </p>
              <p className="font-body text-xs text-gray-500 mt-0.5">
                You learned <strong>"{notification.word.word}"</strong> here. Quick review?
              </p>
            </div>
            <Link href="/review/flashcards" className="text-xs font-heading font-bold text-primary whitespace-nowrap">
              {t.memoryMapReview} →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pin list */}
      <div className="space-y-2">
        <h2 className="font-heading font-extrabold text-sm text-dark">📍 Memory Locations</h2>
        {activePins.map(pin => (
          <motion.button
            key={pin.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedPin(pin)}
            className="w-full card-base p-3.5 flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: pin.colorPalette + "20" }}>
              <MapPin className="w-4 h-4" style={{ color: pin.colorPalette }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-dark truncate">{pin.locationName}</p>
              <p className="font-body text-xs text-gray-400 truncate">{pin.sceneDesc}</p>
            </div>
            <span className="font-heading font-bold text-xs text-gray-400">{pin.words.length} words</span>
          </motion.button>
        ))}
      </div>

      {/* Pin modal */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end justify-center px-4 pb-6"
            onClick={() => setSelectedPin(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedPin.colorPalette }} />
                    <h3 className="font-heading font-extrabold text-base text-dark">{selectedPin.locationName}</h3>
                  </div>
                  <p className="font-body text-xs text-gray-400 mt-0.5">{selectedPin.sceneDesc}</p>
                </div>
                <button onClick={() => setSelectedPin(null)} className="p-1.5 rounded-xl hover:bg-gray-50">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedPin.words.map(w => (
                  <div key={w.id} className="rounded-2xl bg-gray-50 border border-card-border p-2.5">
                    <p className="font-heading font-bold text-sm text-dark">{w.word}</p>
                    <p className="font-body text-[11px] text-gray-500">{w.translation}</p>
                    {w.masteryCount >= 5 && (
                      <span className="text-[9px] font-heading font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Mastered</span>
                    )}
                  </div>
                ))}
              </div>
              <Link
                href="/review/flashcards"
                onClick={() => setSelectedPin(null)}
                className="block w-full py-3 rounded-2xl bg-primary text-white font-heading font-bold text-sm text-center"
              >
                {t.memoryMapReview}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
