"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Loader2, Download } from "lucide-react";
import type { Icon, DivIcon } from "leaflet";

// Leaflet CSS — must be imported client-side only
import "leaflet/dist/leaflet.css";

interface NearbyDeck {
  id: string;
  creatorName: string;
  words: string[];
  locationName: string;
  distanceKm: number;
  publishedAt: string;
}

interface NearbyMapProps {
  userLocation: { lat: number; lng: number };
  decks: NearbyDeck[];
  onImport: (deck: NearbyDeck) => void;
  importing: string | null;
  imported: Set<string>;
}

// Re-center map when userLocation changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Fix Leaflet's broken default icon in webpack/Next.js environments
function buildIcon(color: "blue" | "red"): Icon | DivIcon {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet") as typeof import("leaflet");
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color === "blue" ? "#1ad3e2" : "#ef4444"};border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

export default function NearbyMap({ userLocation, decks, onImport, importing, imported }: NearbyMapProps) {
  const userIcon = buildIcon("blue");
  const deckIcon = buildIcon("red");

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={14}
      style={{ width: "100%", height: "100%", borderRadius: "16px" }}
      zoomControl={true}
    >
      <MapRecenter lat={userLocation.lat} lng={userLocation.lng} />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* User location pin */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>
          <p className="font-heading font-bold text-sm">You are here</p>
        </Popup>
      </Marker>

      {/* Deck pins */}
      {decks.map((deck) => {
        // SharedDecks have lat/lng; NearbyDeck from API may not — skip if missing
        const lat = (deck as unknown as { locationLat?: number }).locationLat;
        const lng = (deck as unknown as { locationLng?: number }).locationLng;
        if (!lat || !lng) return null;

        const isImported = imported.has(deck.id);
        const isImporting = importing === deck.id;

        return (
          <Marker key={deck.id} position={[lat, lng]} icon={deckIcon}>
            <Popup>
              <div className="space-y-2 min-w-[160px]">
                <p className="font-heading font-bold text-sm">{deck.creatorName}</p>
                <p className="font-body text-xs text-gray-500">{deck.locationName}</p>
                <p className="font-body text-xs text-gray-400">
                  {deck.words.length} words · {deck.distanceKm < 1
                    ? `${Math.round(deck.distanceKm * 1000)}m`
                    : `${deck.distanceKm.toFixed(1)}km`} away
                </p>
                <button
                  onClick={() => onImport(deck)}
                  disabled={isImported || !!importing}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-heading font-bold text-xs transition-all ${
                    isImported
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  } disabled:opacity-60`}
                >
                  {isImporting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isImported ? (
                    "✓ Added"
                  ) : (
                    <><Download className="w-3 h-3" /> Import</>
                  )}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
