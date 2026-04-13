"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Download, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/i18n";

// FIX 4: dynamic import — Leaflet cannot run on the server
const NearbyMap = dynamic(() => import("@/components/community/NearbyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  ),
});

interface NearbyDeck {
  id: string;
  creatorName: string;
  words: string[];
  locationName: string;
  distanceKm: number;
  publishedAt: string;
}

const MOCK_DECKS: NearbyDeck[] = [
  { id: "d1", creatorName: "Nong Mint", words: ["agenda", "deadline", "proposal"], locationName: "Siam Paragon", distanceKm: 0.3, publishedAt: new Date().toISOString() },
  { id: "d2", creatorName: "P'Arm", words: ["recommend", "atmosphere", "regular", "ambience"], locationName: "Central World", distanceKm: 0.8, publishedAt: new Date().toISOString() },
  { id: "d3", creatorName: "Ton", words: ["platform", "departure", "connection", "transit"], locationName: "Asok BTS", distanceKm: 1.4, publishedAt: new Date().toISOString() },
];

function DistanceBadge({ km }: { km: number }) {
  const label = km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  const color = km < 0.5 ? "bg-emerald-100 text-emerald-700" : km < 1.5 ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${color}`}>
      {label} away
    </span>
  );
}

export default function NearbyDecksPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [decks, setDecks] = useState<NearbyDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());

  const fetchNearby = useCallback((lat: number, lng: number) => {
    setLoading(true);
    fetch(`/api/community/decks/nearby?lat=${lat}&lng=${lng}&radius=5`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.decks) && data.decks.length > 0) setDecks(data.decks);
        else setDecks(MOCK_DECKS);
      })
      .catch(() => setDecks(MOCK_DECKS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported on this device");
      setDecks(MOCK_DECKS);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        fetchNearby(lat, lng);
      },
      () => {
        setGpsError("Location access denied — showing demo decks");
        setDecks(MOCK_DECKS);
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, [fetchNearby]);

  const handleImport = async (deck: NearbyDeck) => {
    if (importing || imported.has(deck.id)) return;
    setImporting(deck.id);
    try {
      await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneDesc: `Imported from ${deck.locationName}`,
          vocabulary: deck.words.map(w => ({ word: w, translation: w, example: `Use "${w}" in a sentence.`, difficulty: "intermediate", phonetic: "" })),
          atmosphere: "community",
          ambientSound: "cafe",
          colorPalette: "#1ad3e2",
        }),
      });
      setImported(prev => new Set([...prev, deck.id]));
    } catch {
      // silently fail
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-card-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-[480px] mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-card-border flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-heading font-extrabold text-lg text-dark">{t.nearbyTitle}</h1>
            <p className="font-body text-xs text-gray-500">Vocabulary shared near your location</p>
          </div>
          <MapPin className="w-5 h-5 text-primary" />
        </div>
      </motion.div>

      <div className="max-w-[480px] mx-auto px-4 py-4 space-y-4">
        {/* GPS error banner */}
        <AnimatePresence>
          {gpsError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="font-body text-xs text-amber-700">{gpsError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FIX 4: Leaflet map — 60% viewport height, shown when GPS available */}
        {userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl overflow-hidden border border-card-border shadow-card"
            style={{ height: "55vw", maxHeight: 280, minHeight: 180 }}
          >
            <NearbyMap
              userLocation={userLocation}
              decks={decks}
              onImport={handleImport}
              importing={importing}
              imported={imported}
            />
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <MapPin className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="font-body text-sm text-gray-500">Finding decks near you...</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="text-5xl">🗺️</span>
            <p className="font-heading font-bold text-dark">No decks nearby yet</p>
            <p className="font-body text-sm text-gray-500">Be the first to share a deck in your area!</p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/snap")}
              className="btn-aqua px-6 py-3"
            >
              Create a Deck
            </motion.button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-gray-500">{decks.length} deck{decks.length !== 1 ? "s" : ""} found</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (userLocation) fetchNearby(userLocation.lat, userLocation.lng);
                }}
                className="flex items-center gap-1 text-primary font-body text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </motion.button>
            </div>

            <AnimatePresence>
              {decks.map((deck, i) => (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="card-base p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading font-bold text-sm text-dark">{deck.creatorName}</p>
                        <DistanceBadge km={deck.distanceKm} />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <p className="font-body text-xs text-gray-500">{deck.locationName}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={imported.has(deck.id) ? {} : { scale: 1.05 }}
                      whileTap={imported.has(deck.id) ? {} : { scale: 0.95 }}
                      onClick={() => handleImport(deck)}
                      disabled={!!importing || imported.has(deck.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-heading font-bold text-xs flex-shrink-0 transition-all ${
                        imported.has(deck.id)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-primary/10 text-primary"
                      } disabled:opacity-60`}
                    >
                      {importing === deck.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : imported.has(deck.id) ? (
                        "✓ Added"
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> Import</>
                      )}
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {deck.words.map(w => (
                      <span key={w} className="px-2.5 py-1 bg-gray-100 rounded-full font-body text-xs text-dark">
                        {w}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
