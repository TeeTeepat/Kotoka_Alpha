"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, MapPin, BarChart2, Mic, Shield, Trash2, CheckCircle2, AlertTriangle, Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface ConsentState {
  photos: boolean;
  gps: boolean;
  sessionBehavior: boolean;
  voiceRecording: boolean;
  consentedAt?: string;
  updatedAt?: string;
}

const CONSENT_ITEMS = [
  {
    key: "photos" as const,
    icon: Camera,
    emoji: "📸",
    title: "Photos for vocab generation",
    description: "Used only to extract vocabulary from photos you take",
    required: true,
  },
  {
    key: "gps" as const,
    icon: MapPin,
    emoji: "📍",
    title: "GPS for Memory Map",
    description: "Powers nearby deck discovery and location tagging",
    required: true,
  },
  {
    key: "sessionBehavior" as const,
    icon: BarChart2,
    emoji: "📊",
    title: "Session behavior tracking",
    description: "Improves your personalized study schedule",
    required: false,
  },
  {
    key: "voiceRecording" as const,
    icon: Mic,
    emoji: "🎙",
    title: "Voice recording backup",
    description: "Enables pronunciation practice and replay",
    required: false,
  },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <motion.button
      onClick={disabled ? undefined : onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-gray-200"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const [consent, setConsent] = useState<ConsentState>({
    photos: true,
    gps: true,
    sessionBehavior: true,
    voiceRecording: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/consent/save")
      .then(r => r.json())
      .then(data => {
        if (data) setConsent(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof Omit<ConsentState, "consentedAt" | "updatedAt">) => {
    const item = CONSENT_ITEMS.find(i => i.key === key);
    if (item?.required) return;
    setConsent(c => ({ ...c, [key]: !c[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/consent/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consent),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteData = async () => {
    setDeleting(true);
    try {
      await fetch("/api/user", { method: "DELETE" });
      router.push("/login");
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-card-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-[480px] mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-card-border flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-heading font-extrabold text-lg text-dark">{t.settingsTitle}</h1>
            {consent.updatedAt && (
              <p className="font-body text-xs text-gray-500">
                Last updated: {new Date(consent.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <Shield className="w-5 h-5 text-primary" />
        </div>
      </motion.div>

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Language Switcher */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-base p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-dark mb-1">{t.settingsLanguage}</p>
                  <p className="font-body text-xs text-gray-500 mb-3">{t.settingsLanguageDesc}</p>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLocale("th")}
                      className={`flex-1 py-2 rounded-xl font-heading font-bold text-sm border-2 transition-all ${locale === "th" ? "border-primary bg-primary/10 text-primary" : "border-card-border text-gray-500"}`}
                    >
                      {t.settingsThaiLanguage}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLocale("en")}
                      className={`flex-1 py-2 rounded-xl font-heading font-bold text-sm border-2 transition-all ${locale === "en" ? "border-primary bg-primary/10 text-primary" : "border-card-border text-gray-500"}`}
                    >
                      {t.settingsEnglishLanguage}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {CONSENT_ITEMS.map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                className="card-base p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-xl">
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
                        checked={item.required ? true : consent[item.key]}
                        onChange={() => toggle(item.key)}
                        disabled={item.required}
                      />
                    </div>
                    <p className="font-body text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Save button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-aqua py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saved ? (
                <><CheckCircle2 className="w-5 h-5" /> {t.settingsSaved}</>
              ) : saving ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                t.save
              )}
            </motion.button>

            {/* Delete data */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="card-base p-4 border-red-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-sm text-dark">{t.settingsDeleteData}</p>
                  <p className="font-body text-xs text-gray-500">{t.settingsDeleteDataDesc}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 rounded-xl font-heading font-bold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="card-base bg-white p-6 max-w-sm w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-dark">{t.settingsDeleteData}</h3>
                    <p className="font-body text-sm text-gray-500">{t.settingsDeleteConfirm}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-heading font-bold text-dark"
                  >
                    {t.cancel}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteData}
                    disabled={deleting}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-heading font-bold disabled:opacity-60"
                  >
                    {deleting ? t.loading : t.delete}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
