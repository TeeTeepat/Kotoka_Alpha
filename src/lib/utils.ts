import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function emotionToColor(score: number): string {
  // 0 = calm (cool blue) → 100 = energized (warm orange)
  const r = Math.round(26 + (255 - 26) * (score / 100));
  const g = Math.round(211 - (211 - 140) * (score / 100));
  const b = Math.round(226 - (226 - 66) * (score / 100));
  return `rgb(${r}, ${g}, ${b})`;
}

export function emotionToGradient(score: number): string {
  if (score < 25) return "from-blue-100 to-cyan-50";
  if (score < 50) return "from-cyan-50 to-teal-50";
  if (score < 75) return "from-amber-50 to-orange-50";
  return "from-orange-100 to-red-50";
}

export function getDefaultStats() {
  return {
    hearts: 5,
    streak: 0,
    coins: 0,
    wordsLearned: 0,
  };
}

export function loadStats() {
  if (typeof window === "undefined") return getDefaultStats();
  try {
    const stored = localStorage.getItem("kotoka-stats");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return getDefaultStats();
}

export function saveStats(stats: {
  hearts: number;
  streak: number;
  coins: number;
  wordsLearned: number;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem("kotoka-stats", JSON.stringify(stats));
}
