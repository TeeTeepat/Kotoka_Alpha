"use client";

import { useEffect, useState } from "react";
import {
  getTimeOfDay,
  getWorldTint,
  type TimeOfDay,
  type Weather,
} from "@/lib/compositing";

/**
 * L3: full-viewport global tint from local time of day + current weather.
 * Renders behind everything, never announces changes.
 */
export default function WorldTint({ weather }: { weather: Weather }) {
  const [time, setTime] = useState<TimeOfDay>(() => getTimeOfDay());

  useEffect(() => {
    // keep time-of-day fresh if the app stays open across a boundary
    const t = setInterval(() => setTime(getTimeOfDay()), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const tint = getWorldTint(time, weather);

  return (
    <div
      className="fixed inset-0 pointer-events-none transition-[background] duration-[3000ms]"
      style={{ background: tint.background, zIndex: 0 }}
    >
      {tint.weatherWash && (
        <div
          className="absolute inset-0"
          style={{ background: tint.weatherWash }}
        />
      )}
    </div>
  );
}
