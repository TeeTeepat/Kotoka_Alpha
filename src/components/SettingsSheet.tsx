"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { X, Globe, Volume2, VolumeX, LogOut, User as UserIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { isSoundMuted, setSoundMuted } from "@/components/hooks/useSoundPlayer";

/**
 * Settings sheet opened by tapping the TopBar avatar chip.
 * Reuses the language-toggle pattern from settings/privacy and the
 * logout sequence from profile/page.tsx.
 */
export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const { t, locale, setLocale } = useLocale();
  const [muted, setMuted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  const displayName = session?.user?.name ?? "Learner";
  const displayEmail = session?.user?.email ?? "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl shadow-xl max-w-[480px] mx-auto"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="font-heading font-extrabold text-lg text-dark">{t.settingsSheetTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Account */}
          <div className="card-base p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-body text-[10px] text-gray-400 uppercase tracking-wide">{t.settingsAccount}</p>
              <p className="font-heading font-bold text-sm text-dark truncate">{displayName}</p>
              {displayEmail && <p className="font-body text-xs text-gray-400 truncate">{displayEmail}</p>}
            </div>
          </div>

          {/* Language */}
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-primary" />
              <p className="font-heading font-bold text-sm text-dark">{t.settingsLanguage}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocale("th")}
                className={`flex-1 py-2 rounded-xl font-heading font-bold text-sm border-2 transition-all ${
                  locale === "th" ? "border-primary bg-primary/10 text-primary" : "border-card-border text-gray-500"
                }`}
              >
                {t.settingsThaiLanguage}
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`flex-1 py-2 rounded-xl font-heading font-bold text-sm border-2 transition-all ${
                  locale === "en" ? "border-primary bg-primary/10 text-primary" : "border-card-border text-gray-500"
                }`}
              >
                {t.settingsEnglishLanguage}
              </button>
            </div>
          </div>

          {/* Sound */}
          <div className="card-base p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {muted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-primary" />}
              <p className="font-heading font-bold text-sm text-dark">{t.settingsSound}</p>
            </div>
            <motion.button
              onClick={toggleMute}
              className={`relative w-12 h-6 rounded-full transition-colors ${!muted ? "bg-primary" : "bg-gray-200"}`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                animate={{ left: !muted ? "calc(100% - 22px)" : "2px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-heading font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            {loggingOut ? (
              <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {loggingOut ? t.loading : t.profileLogout}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
