// Atmospheric flashcard tint resolver — Study tab only.
//
// Copied (not imported) from src/lib/compositing/index.ts's WorldTint idiom
// per WS4 scope: components/world and its ownership sit with another
// workstream, so the small gradient/weather-wash logic is duplicated here
// rather than importing across workstreams. Two differences from the world
// tint: (1) time-of-day is read from the *snap* timestamp, not "now" — the
// point is environmental memory anchoring to the moment the photo was
// taken; (2) when no weather was captured at snap time, the tint falls back
// to the deck's colorPalette instead of a weather wash.

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type Weather = "clear" | "clouds" | "rain" | "snow" | "storm" | "mist";

export function timeOfDayAt(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

/** Map a loose stored weather string (OpenWeather "main" or our own bucket) to our Weather union. */
export function toWeatherBucket(raw: string | null | undefined): Weather | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (["clear", "clouds", "rain", "snow", "storm", "mist"].includes(v)) return v as Weather;
  if (v === "drizzle") return "rain";
  if (v === "thunderstorm") return "storm";
  if (["fog", "haze", "smoke"].includes(v)) return "mist";
  return null;
}

const TIME_GRADIENTS: Record<TimeOfDay, [string, string, string]> = {
  dawn: ["#ffd9b8", "#ffeede", "#e8f6ff"],
  day: ["#bfeaf5", "#e6f8fc", "#f4fdff"],
  dusk: ["#f5b48a", "#e8a7c0", "#8f9fd1"],
  night: ["#1c2a4a", "#2c3d63", "#43567f"],
};

const WEATHER_OVERLAYS: Record<Weather, string | null> = {
  clear: null,
  clouds: "rgba(148, 163, 184, 0.28)",
  rain: "rgba(71, 96, 133, 0.32)",
  snow: "rgba(226, 236, 246, 0.4)",
  storm: "rgba(40, 50, 74, 0.42)",
  mist: "rgba(203, 213, 225, 0.38)",
};

/** Fallback wash keyed by time of day only, used when no weather was captured at snap time. */
const TIME_ONLY_WASH: Record<TimeOfDay, string | null> = {
  dawn: "rgba(255, 200, 150, 0.22)",
  day: null,
  dusk: "rgba(220, 140, 170, 0.24)",
  night: "rgba(20, 30, 60, 0.35)",
};

export interface AtmosphereTintSpec {
  background: string;
  weatherWash: string | null;
  darkGround: boolean;
}

/**
 * Compute the card's tint. When `weatherAtSnap` is known, use the real
 * time-of-day + weather gradient (same recipe as the world tint). When it's
 * null, blend the deck's `colorPalette` into the time-of-day gradient
 * instead, so the mood-only fallback still looks distinct per deck.
 */
export function atmosphereTint(params: {
  snapAt: Date;
  weatherAtSnap: string | null;
  colorPalette: string;
}): AtmosphereTintSpec {
  const time = timeOfDayAt(params.snapAt);
  const weather = toWeatherBucket(params.weatherAtSnap);

  if (weather) {
    const [top, mid, bottom] = TIME_GRADIENTS[time];
    return {
      background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bottom} 100%)`,
      weatherWash: WEATHER_OVERLAYS[weather],
      darkGround: time === "night" || weather === "storm",
    };
  }

  // Mood-only fallback: deck color leads, time-of-day supplies a soft wash.
  const [, , bottom] = TIME_GRADIENTS[time];
  return {
    background: `linear-gradient(180deg, ${params.colorPalette} 0%, ${bottom} 100%)`,
    weatherWash: TIME_ONLY_WASH[time],
    darkGround: time === "night",
  };
}
