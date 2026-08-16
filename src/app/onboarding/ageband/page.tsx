"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout, Rocket, Check } from "lucide-react";
import type { AgeBand } from "@/lib/srs/fixedSchedule";

const BANDS: {
  band: AgeBand;
  title: string;
  subtitle: string;
  icon: typeof Sprout;
  accent: string;
}[] = [
  {
    band: "7-10",
    title: "7–10 years",
    subtitle: "Smaller word sets, extra listens — a gentle pace",
    icon: Sprout,
    accent: "from-emerald-300 to-teal-400",
  },
  {
    band: "11-15",
    title: "11–15 years",
    subtitle: "Bigger word sets, sentence writing — a faster pace",
    icon: Rocket,
    accent: "from-sky-300 to-indigo-400",
  },
];

export default function AgeBandOnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<AgeBand | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      // Final onboarding step — kids-only flow, no CEFR test.
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageBand: selected, isOnboarded: true }),
      });
    } finally {
      setSaving(false);
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-4 mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Kotoka" className="w-14 h-14 rounded-2xl shadow-card" />
        <div className="text-center space-y-1">
          <h1 className="font-heading font-extrabold text-3xl text-dark">
            How old is our explorer?
          </h1>
          <p className="font-body text-sm text-gray-400">
            We shape each day&apos;s adventure to fit just right
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {BANDS.map(({ band, title, subtitle, icon: Icon, accent }, i) => {
          const isSelected = selected === band;
          return (
            <motion.button
              key={band}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(band)}
              className={`w-full flex items-center gap-4 p-5 rounded-3xl bg-white text-left shadow-card border-2 transition-colors ${
                isSelected ? "border-primary bg-primary/5" : "border-card-border"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-heading font-extrabold text-xl text-dark">{title}</p>
                <p className="font-body text-xs text-gray-400 mt-0.5">{subtitle}</p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? "border-primary bg-primary" : "border-card-border"
                }`}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ scale: selected ? 1.03 : 1 }}
          whileTap={{ scale: selected ? 0.97 : 1 }}
          onClick={handleContinue}
          disabled={!selected || saving}
          className="btn-aqua w-full py-4 text-base disabled:opacity-40 flex items-center justify-center"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>Continue →</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
