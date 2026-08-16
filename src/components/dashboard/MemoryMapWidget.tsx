"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface MapWord { id: string; word: string; }
interface MemoryPin {
  id: string;
  locationName: string;
  colorPalette: string;
  locationLat: number;
  locationLng: number;
  words: MapWord[];
}

// Projection math reused from src/app/memory-map/page.tsx — real pins only, no demo fallback.
function getBounds(pins: MemoryPin[]) {
  const lats = pins.map((p) => p.locationLat);
  const lngs = pins.map((p) => p.locationLng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.2, 0.005);
  const padLng = Math.max((maxLng - minLng) * 0.2, 0.005);
  return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
}

function projectToPercent(lat: number, lng: number, bounds: ReturnType<typeof getBounds>) {
  const pad = 0.12;
  const x = pad + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * (1 - 2 * pad);
  const y = pad + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1)) * (1 - 2 * pad);
  return { x: x * 100, y: y * 100 };
}

export default function MemoryMapWidget({ pins }: { pins: MemoryPin[] }) {
  const { t } = useLocale();
  const bounds = pins.length > 0 ? getBounds(pins) : null;

  return (
    <Link href="/memory-map">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="card-base p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-extrabold text-sm text-dark">{t.dashMemoryMapTitle}</h2>
          </div>
          <span className="font-body text-xs text-gray-400">{pins.length}</span>
        </div>

        {pins.length === 0 || !bounds ? (
          <p className="font-body text-xs text-gray-400 text-center py-4">{t.dashMemoryMapEmpty}</p>
        ) : (
          <div className="relative w-full rounded-2xl overflow-hidden border border-card-border" style={{ height: 120 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-teal-50/70 to-emerald-50" />
            {pins.slice(0, 8).map((pin, i) => {
              const { x, y } = projectToPercent(pin.locationLat, pin.locationLng, bounds);
              return (
                <motion.div
                  key={pin.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: pin.colorPalette }}
                  >
                    <span className="text-[6px] text-white font-bold">{pin.words.length}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
