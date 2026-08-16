"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const AVATARS = ["🦊", "🐼", "🐸", "🦁", "🐨", "🐧", "🦄", "🐙", "🦖", "🐝", "🐬", "🦉"];

export default function NameOnboardingPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: avatar }),
      });
    } finally {
      setSaving(false);
    }
    router.push("/onboarding/ageband");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-4 mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Kotoka" className="w-14 h-14 rounded-2xl shadow-card" />
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-2 rounded-full"
              style={{ width: s === 2 ? 24 : 8, backgroundColor: s <= 2 ? "#1ad3e2" : "#e2e8f0" }}
            />
          ))}
        </div>
        <div className="text-center space-y-1">
          <h1 className="font-heading font-extrabold text-2xl text-dark">{t.onboardNameTitle}</h1>
          <p className="font-body text-sm text-gray-400">{t.onboardNameSubtitle}</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            key={avatar}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[#0fb8c9] flex items-center justify-center text-5xl shadow-card"
          >
            {avatar}
          </motion.div>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <motion.button
                key={a}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAvatar(a)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border-2 transition-colors ${
                  avatar === a ? "border-primary bg-primary/10" : "border-transparent bg-gray-50"
                }`}
              >
                {a}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.onboardNamePlaceholder}
          maxLength={30}
          className="w-full text-center border-2 border-card-border rounded-2xl px-4 py-3 font-heading font-bold text-lg text-dark focus:outline-none focus:border-primary transition-colors"
        />

        <motion.button
          whileHover={{ scale: name.trim() ? 1.03 : 1 }}
          whileTap={{ scale: name.trim() ? 0.97 : 1 }}
          onClick={handleContinue}
          disabled={!name.trim() || saving}
          className="btn-aqua w-full py-4 text-base disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" /> {t.onboardNameContinue}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
