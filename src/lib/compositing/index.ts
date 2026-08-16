// Living Sandbox compositing layers (CSS/SVG placeholder implementation).
// L0 = silhouette body plans, L1 = texture overlays, L3 = global world tint.

export const BODY_PLANS = [
  "quadruped",
  "biped",
  "bird",
  "fish",
  "vehicle",
  "container",
  "tool",
  "plant",
  "building",
  "blob",
] as const;
export type BodyPlan = (typeof BODY_PLANS)[number];

export const SENSORY_SIZES = ["small", "medium", "large"] as const;
export type SensorySize = (typeof SENSORY_SIZES)[number];

export const TEXTURES = [
  "furry",
  "scaly",
  "smooth",
  "rough",
  "soft",
  "hard",
  "warm",
  "cold",
] as const;
export type Texture = (typeof TEXTURES)[number];

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type Weather = "clear" | "clouds" | "rain" | "snow" | "storm" | "mist";

export function asBodyPlan(value: string | null | undefined): BodyPlan {
  return BODY_PLANS.includes(value as BodyPlan) ? (value as BodyPlan) : "blob";
}

export function asSensorySize(value: string | null | undefined): SensorySize {
  return SENSORY_SIZES.includes(value as SensorySize)
    ? (value as SensorySize)
    : "medium";
}

export function asTexture(value: string | null | undefined): Texture | null {
  return TEXTURES.includes(value as Texture) ? (value as Texture) : null;
}

/** L0: pixel footprint per sensory size. */
export const SIZE_PX: Record<SensorySize, number> = {
  small: 52,
  medium: 76,
  large: 104,
};

/**
 * L0: silhouette path data, all drawn in a 100x100 viewBox with the
 * ground line at y=96 so sprites sit on the same baseline.
 */
export const BODY_PLAN_PATHS: Record<BodyPlan, string> = {
  quadruped:
    "M18 96 L18 74 Q16 58 30 54 L66 52 Q80 50 82 40 Q83 30 76 26 Q84 24 86 32 L92 34 Q94 38 88 40 Q88 52 78 58 L80 74 L80 96 L72 96 L72 78 L64 76 L62 96 L54 96 L54 74 L36 74 L34 96 L26 96 L26 76 L22 78 Z",
  biped:
    "M50 8 Q62 8 62 20 Q62 30 54 32 L56 40 Q68 44 68 58 L66 74 L60 74 L60 62 L58 96 L50 96 L50 70 L46 70 L46 96 L38 96 L36 62 L34 74 L28 74 L28 56 Q28 44 40 40 L42 32 Q38 30 38 20 Q38 8 50 8 Z",
  bird:
    "M30 92 L34 78 Q18 74 16 58 Q14 40 30 34 Q36 20 52 20 Q60 20 64 26 L84 22 L70 34 Q78 42 74 56 Q70 72 52 76 L54 78 Q58 78 58 82 L50 82 L48 92 L42 92 L42 80 Q38 80 38 92 Z",
  fish: "M12 52 L26 38 L26 48 Q34 26 58 26 Q80 26 88 46 Q90 52 88 58 Q78 78 56 78 Q34 78 26 58 L26 66 L12 52 Z M62 34 L70 22 L76 34 Z",
  vehicle:
    "M10 74 Q8 60 20 58 L28 44 Q30 40 36 40 L66 40 Q72 40 74 44 L82 58 Q92 60 90 74 L82 74 Q82 84 72 84 Q62 84 62 74 L40 74 Q40 84 30 84 Q20 84 20 74 Z",
  container:
    "M26 34 L74 34 Q78 34 78 38 L78 42 L74 44 L74 90 Q74 96 68 96 L32 96 Q26 96 26 90 L26 44 L22 42 L22 38 Q22 34 26 34 Z M38 26 Q38 20 50 20 Q62 20 62 26 L62 34 L38 34 Z",
  tool: "M24 16 Q42 8 56 20 L64 28 Q70 24 74 28 L84 38 Q88 42 84 46 L76 54 Q72 58 68 54 L60 46 L44 62 L38 96 L28 96 L34 56 L28 50 Q16 38 24 16 Z",
  plant:
    "M46 96 L46 60 Q28 58 22 42 Q18 30 26 22 Q40 26 46 42 Q46 24 56 12 Q70 18 68 36 Q66 52 54 58 L54 96 Z M34 96 L66 96 L62 82 L38 82 Z",
  building:
    "M20 96 L20 40 L38 40 L38 24 L50 12 L62 24 L62 32 L80 32 L80 96 Z M28 52 L34 52 L34 60 L28 60 Z M44 52 L50 52 L50 60 L44 60 Z M68 44 L74 44 L74 52 L68 52 Z M68 62 L74 62 L74 70 L68 70 Z M28 70 L34 70 L34 78 L28 78 Z M44 70 L50 70 L50 78 L44 78 Z",
  blob: "M50 18 Q72 18 80 38 Q88 56 76 72 Q66 86 50 86 Q34 86 24 72 Q12 56 20 38 Q28 18 50 18 Z",
};

/** Base silhouette fill per body plan (kept muted; texture sits on top). */
export const BODY_PLAN_FILLS: Record<BodyPlan, string> = {
  quadruped: "#8d7b68",
  biped: "#7d8ba1",
  bird: "#6fa8b8",
  fish: "#5f9ec9",
  vehicle: "#8892a6",
  container: "#a68f6f",
  tool: "#8f8a80",
  plant: "#6f9f72",
  building: "#9a8fa0",
  blob: "#94a3b8",
};

/**
 * L1: texture overlay tiles, expressed as tiny SVG <pattern> fragments.
 * Each entry describes markup rendered inside a <pattern> element.
 */
export interface TexturePatternSpec {
  size: number;
  markup: string;
  opacity: number;
}

export const TEXTURE_PATTERNS: Record<Texture, TexturePatternSpec> = {
  furry: {
    size: 8,
    markup:
      '<path d="M1 7 Q2 3 1 1 M4 8 Q5 4 4 2 M7 7 Q8 3 7 1" stroke="rgba(255,255,255,0.55)" stroke-width="0.9" fill="none" stroke-linecap="round"/>',
    opacity: 0.5,
  },
  scaly: {
    size: 10,
    markup:
      '<path d="M0 5 A5 5 0 0 1 10 5 M-5 10 A5 5 0 0 1 5 10 M5 10 A5 5 0 0 1 15 10" stroke="rgba(255,255,255,0.5)" stroke-width="0.9" fill="none"/>',
    opacity: 0.5,
  },
  smooth: {
    size: 24,
    markup:
      '<rect x="0" y="0" width="24" height="10" fill="rgba(255,255,255,0.28)" rx="5"/>',
    opacity: 0.35,
  },
  rough: {
    size: 9,
    markup:
      '<path d="M0 7 L2 4 L4 7 L6 3 L9 7" stroke="rgba(0,0,0,0.35)" stroke-width="0.9" fill="none"/><circle cx="7" cy="1.5" r="0.8" fill="rgba(0,0,0,0.3)"/>',
    opacity: 0.5,
  },
  soft: {
    size: 12,
    markup:
      '<circle cx="3" cy="3" r="2.2" fill="rgba(255,255,255,0.4)"/><circle cx="9" cy="9" r="2.2" fill="rgba(255,255,255,0.3)"/>',
    opacity: 0.5,
  },
  hard: {
    size: 10,
    markup:
      '<path d="M0 0 L10 10 M10 0 L0 10" stroke="rgba(0,0,0,0.28)" stroke-width="0.8"/>',
    opacity: 0.5,
  },
  warm: {
    size: 12,
    markup:
      '<path d="M0 9 Q3 6 6 9 Q9 12 12 9" stroke="rgba(255,166,84,0.7)" stroke-width="1.2" fill="none"/><path d="M0 4 Q3 1 6 4 Q9 7 12 4" stroke="rgba(255,201,128,0.6)" stroke-width="1" fill="none"/>',
    opacity: 0.6,
  },
  cold: {
    size: 12,
    markup:
      '<path d="M6 1 L6 11 M1 6 L11 6 M3 3 L9 9 M9 3 L3 9" stroke="rgba(173,216,240,0.8)" stroke-width="0.8"/>',
    opacity: 0.55,
  },
};

/** Local time of day bucket. */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

/** Map an OpenWeather condition group to our weather buckets. */
export function mapOpenWeather(main: string | undefined): Weather {
  switch ((main || "").toLowerCase()) {
    case "clouds":
      return "clouds";
    case "rain":
    case "drizzle":
      return "rain";
    case "snow":
      return "snow";
    case "thunderstorm":
      return "storm";
    case "mist":
    case "fog":
    case "haze":
    case "smoke":
      return "mist";
    default:
      return "clear";
  }
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

export interface WorldTintSpec {
  /** Full-viewport background gradient for the sky/world. */
  background: string;
  /** Optional flat weather wash layered over the gradient. */
  weatherWash: string | null;
  /** Whether foreground content should switch to light text. */
  darkGround: boolean;
}

/** L3: compute the global tint from time of day + weather. */
export function getWorldTint(time: TimeOfDay, weather: Weather): WorldTintSpec {
  const [top, mid, bottom] = TIME_GRADIENTS[time];
  return {
    background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bottom} 100%)`,
    weatherWash: WEATHER_OVERLAYS[weather],
    darkGround: time === "night" || weather === "storm",
  };
}

/** Days elapsed since a timestamp (floored). */
export function daysSince(iso: string | Date): number {
  const then = typeof iso === "string" ? new Date(iso) : iso;
  return Math.floor((Date.now() - then.getTime()) / 86_400_000);
}

/**
 * Visual treatment for a collectible sprite. Dim ones desaturate; after 7
 * days still dim they fade further into scenery. Never removed, never
 * announced.
 */
export function collectibleTreatment(dim: boolean, createdAt: string | Date): {
  opacity: number;
  filter: string;
} {
  if (!dim) return { opacity: 1, filter: "none" };
  if (daysSince(createdAt) >= 7) {
    return { opacity: 0.28, filter: "saturate(0.15) brightness(1.05)" };
  }
  return { opacity: 0.55, filter: "saturate(0.35)" };
}
