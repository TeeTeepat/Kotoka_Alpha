"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, MapPin, BarChart2, Mic, ArrowRight, Shield } from "lucide-react";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import KokoMascot from "@/components/KokoMascot";
import { useLocale } from "@/lib/i18n";

const CONSENT_ITEMS = [
  {
    key: "photos",
    icon: Camera,
    emoji: "📸",
    title: "Photos for vocab generation",
    description: "Used only to extract vocabulary from photos you take. Never stored permanently.",
    required: true,
    color: "bg-blue-50 text-blue-500",
  },
  {
    key: "gps",
    icon: MapPin,
    emoji: "📍",
    title: "GPS for Memory Map",
    description: "Powers nearby deck discovery and location tagging on your words.",
    required: true,
    color: "bg-emerald-50 text-emerald-500",
  },
  {
    key: "sessionBehavior",
    icon: BarChart2,
    emoji: "📊",
    title: "Session behavior tracking",
    description: "Helps Koko personalize your study schedule. Optional.",
    required: false,
    color: "bg-purple-50 text-purple-500",
  },
  {
    key: "voiceRecording",
    icon: Mic,
    emoji: "🎙",
    title: "Voice recording backup",
    description: "Enables pronunciation practice and audio replay. Optional.",
    required: false,
    color: "bg-orange-50 text-orange-500",
  },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <motion.button
      onClick={disabled ? undefined : onChange}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-gray-200"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
        animate={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

export default function ConsentPage() {
  const router = useRouter();
  const { play } = useSoundPlayer();
  const { t } = useLocale();
  const [consent, setConsent] = useState({
    photos: true,
    gps: true,
    sessionBehavior: true,
    voiceRecording: false,
  });
  const [loading, setLoading] = useState(false);

  const toggle = (key: keyof typeof consent) => {
    const item = CONSENT_ITEMS.find(i => i.key === key);
    if (item?.required) return;
    play("click");
    setConsent(c => ({ ...c, [key]: !c[key] }));
  };

  const handleAccept = async () => {
    play("unlock");
    setLoading(true);
    try {
      await fetch("/api/consent/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consent),
      });
    } catch {
      // proceed anyway
    }
    router.push("/onboarding/language");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Koko + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <KokoMascot state="greeting" className="w-20 h-20" priority />
          <div>
            <div className="inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full mb-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="font-body text-xs text-primary font-medium">Privacy First</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-dark">Your data, your choice</h1>
            <p className="font-body text-sm text-gray-500 mt-1">
              Koko needs a few permissions to work its magic. Required ones are on by default.
            </p>
          </div>
        </div>

        {/* Consent items */}
        <div className="space-y-3">
          {CONSENT_ITEMS.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="card-base p-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${item.color.split(" ")[0]}`}>
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading font-bold text-sm text-dark">
                      {item.title}
                      {item.required && (
                        <span className="ml-1.5 text-[10px] font-body text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">required</span>
                      )}
                    </p>
                    <Toggle
                      checked={item.required ? true : consent[item.key as keyof typeof consent]}
                      onChange={() => toggle(item.key as keyof typeof consent)}
                      disabled={item.required}
                    />
                  </div>
                  <p className="font-body text-xs text-gray-500 mt-1">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Accept button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAccept}
          disabled={loading}
          className="btn-aqua w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {t.consentAccept} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <p className="font-body text-[11px] text-gray-400 text-center px-4">
          You can change these at any time in Settings → Privacy
        </p>
      </motion.div>
    </div>
  );
}
