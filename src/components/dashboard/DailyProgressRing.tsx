"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const TOTAL_STEPS = 8;

interface DailyProgressRingProps {
  /**
   * Best-effort step count for today's /daily loop. The loop itself keeps its
   * phase machine in React state (not persisted), so this is a coarse,
   * read-only signal derived from server flags — never a hard truth. 0 is a
   * perfectly valid, ungraded answer.
   */
  stepsDone: number;
  greetingName?: string | null;
}

export default function DailyProgressRing({ stepsDone, greetingName }: DailyProgressRingProps) {
  const router = useRouter();
  const { t } = useLocale();
  const clamped = Math.max(0, Math.min(TOTAL_STEPS, stepsDone));
  const pct = clamped / TOTAL_STEPS;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-base p-5 flex items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-gray-400">
          {t.dashGreeting}{greetingName ? `, ${greetingName}` : ""} 👋
        </p>
        <p className="font-heading font-extrabold text-lg text-dark mt-0.5">{t.dashTodayProgress}</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/daily")}
          className="btn-aqua mt-3 px-4 py-2.5 text-sm"
        >
          <Camera className="w-4 h-4" /> {t.dashSnapNow}
        </motion.button>
      </div>

      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 72 72" className="w-20 h-20 -rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="7" />
          <motion.circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="#1ad3e2"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading font-extrabold text-sm text-dark">
            {clamped}/{TOTAL_STEPS}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
