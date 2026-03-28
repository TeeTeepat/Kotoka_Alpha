"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, ArrowLeft } from "lucide-react";

function flagUrl(emoji: string): string {
  const codepoints = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
}

const LANGUAGES = [
  { code: "Thai", flag: "🇹🇭" },
  { code: "English", flag: "🇬🇧" },
  { code: "Japanese", flag: "🇯🇵" },
  { code: "Korean", flag: "🇰🇷" },
  { code: "Chinese Simplified", flag: "🇨🇳" },
  { code: "Chinese Traditional", flag: "🇹🇼" },
  { code: "French", flag: "🇫🇷" },
  { code: "German", flag: "🇩🇪" },
  { code: "Spanish", flag: "🇪🇸" },
  { code: "Portuguese", flag: "🇧🇷" },
  { code: "Italian", flag: "🇮🇹" },
  { code: "Hindi", flag: "🇮🇳" },
  { code: "Arabic", flag: "🇸🇦" },
  { code: "Russian", flag: "🇷🇺" },
  { code: "Dutch", flag: "🇳🇱" },
  { code: "Polish", flag: "🇵🇱" },
  { code: "Swedish", flag: "🇸🇪" },
  { code: "Turkish", flag: "🇹🇷" },
  { code: "Vietnamese", flag: "🇻🇳" },
  { code: "Indonesian", flag: "🇮🇩" },
  { code: "Malay", flag: "🇲🇾" },
  { code: "Filipino", flag: "🇵🇭" },
  { code: "Bengali", flag: "🇧🇩" },
  { code: "Ukrainian", flag: "🇺🇦" },
  { code: "Greek", flag: "🇬🇷" },
  { code: "Hebrew", flag: "🇮🇱" },
  { code: "Czech", flag: "🇨🇿" },
  { code: "Romanian", flag: "🇷🇴" },
  { code: "Finnish", flag: "🇫🇮" },
  { code: "Norwegian", flag: "🇳🇴" },
  { code: "Danish", flag: "🇩🇰" },
  { code: "Hungarian", flag: "🇭🇺" },
  { code: "Persian", flag: "🇮🇷" },
  { code: "Swahili", flag: "🇰🇪" },
  { code: "Urdu", flag: "🇵🇰" },
];

type Lang = typeof LANGUAGES[number];

function LanguageDropdown({
  selected,
  onSelect,
  exclude,
}: {
  selected: Lang;
  onSelect: (l: Lang) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = LANGUAGES.filter((l) => l.code !== exclude);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-[2px] border-primary shadow-md font-heading font-extrabold text-2xl text-primary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flagUrl(selected.flag)} alt={selected.code} className="w-8 h-8 object-contain" />
        <span>{selected.code}</span>
        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 bg-white rounded-2xl shadow-xl border border-card-border overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto py-1">
              {options.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { onSelect(lang); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                    selected.code === lang.code ? "bg-primary/5" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagUrl(lang.flag)} alt={lang.code} className="w-6 h-6 object-contain flex-shrink-0" />
                  <span className={`font-body text-sm flex-1 text-left ${
                    selected.code === lang.code ? "text-primary font-bold" : "text-dark"
                  }`}>
                    {lang.code}
                  </span>
                  {selected.code === lang.code && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SLIDE = {
  enter: (dir: number) => ({ x: dir * 80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -80, opacity: 0 }),
};

export default function LanguageOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [native, setNative] = useState(LANGUAGES[0]); // Thai
  const [learning, setLearning] = useState(LANGUAGES[1]); // English
  const [saving, setSaving] = useState(false);
  const direction = useRef(1);

  // Sync kotoka-uid to the authenticated user before saving languages
  useEffect(() => {
    fetch("/api/auth/init", { method: "POST" });
  }, []);

  // Keep learning ≠ native
  useEffect(() => {
    if (learning.code === native.code) {
      const fallback = LANGUAGES.find((l) => l.code !== native.code)!;
      setLearning(fallback);
    }
  }, [native, learning.code]);

  const goToStep2 = () => {
    direction.current = 1;
    setStep(2);
  };

  const goBack = () => {
    direction.current = -1;
    setStep(1);
  };

  const handleConfirm = async () => {
    setSaving(true);
    // Ensure kotoka-uid is synced to the authenticated user before saving
    await fetch("/api/auth/init", { method: "POST" });
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetLanguage: native.code,
        learningLanguage: learning.code,
      }),
    });
    setSaving(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* Logo + progress */}
      <div className="flex flex-col items-center gap-4 mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Kotoka" className="w-14 h-14 rounded-2xl shadow-card" />

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {[1, 2].map((s) => (
            <motion.div
              key={s}
              animate={{ width: step === s ? 24 : 8, backgroundColor: step === s ? "#1ad3e2" : "#e2e8f0" }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Animated step content */}
      <div className="w-full max-w-xs relative" style={{ minHeight: 260 }}>
        <AnimatePresence mode="wait" custom={direction.current}>
          {step === 1 ? (
            <motion.div
              key="step1"
              custom={direction.current}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-2">
                <p className="font-body text-gray-400 text-xs uppercase tracking-widest">Step 1 of 2 · Your language</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="font-heading font-extrabold text-3xl text-dark">Are you</span>
                  <LanguageDropdown selected={native} onSelect={setNative} />
                  <span className="font-heading font-extrabold text-3xl text-dark">?</span>
                </div>
                <p className="font-body text-sm text-gray-400 pt-1">
                  Translations will appear in {native.code}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={goToStep2}
                className="btn-aqua w-full py-4 text-base"
              >
                Yes, I speak {native.code} →
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              custom={direction.current}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-2">
                <p className="font-body text-gray-400 text-xs uppercase tracking-widest">Step 2 of 2 · Target language</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="font-heading font-extrabold text-3xl text-dark">I want to learn</span>
                  <LanguageDropdown selected={learning} onSelect={setLearning} exclude={native.code} />
                </div>
                <p className="font-body text-sm text-gray-400 pt-1">
                  Vocabulary words will be in {learning.code}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={saving}
                className="btn-aqua w-full py-4 text-base disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Let&apos;s learn {learning.code}!</>
                )}
              </motion.button>

              <button onClick={goBack} className="flex items-center gap-1 font-body text-sm text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={() => router.push("/")} className="mt-8 font-body text-sm text-gray-400 hover:text-gray-600">
        Skip for now
      </button>
    </div>
  );
}
