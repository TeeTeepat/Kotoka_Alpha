"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Volume2, Layers, PenLine, Mic } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";

/**
 * Guided path activities section: cards into the /daily flexible steps
 * (Listen, Flashcard, Read/Write, Dictation). /daily doesn't expose a
 * per-step deep link today — it's one guided loop starting at Snap, whose
 * PathPicker gates route the child through these steps in flexible order —
 * so every card launches /daily itself rather than faking a link that
 * doesn't exist.
 */
const STEPS = [
  { id: "listen", icon: Volume2, labelKey: "studyPathListen" as const },
  { id: "flashcard", icon: Layers, labelKey: "studyPathFlashcard" as const },
  { id: "read_write", icon: PenLine, labelKey: "studyPathReadWrite" as const },
  { id: "dictation", icon: Mic, labelKey: "studyPathDictation" as const },
];

export default function GuidedPathSection() {
  const { t } = useLocale();
  const { play } = useSoundPlayer();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-heading font-extrabold text-base text-dark">{t.studyPathTitle}</h2>
        <p className="font-body text-xs text-gray-400">{t.studyPathSubtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {STEPS.map(({ id, icon: Icon, labelKey }) => (
          <Link key={id} href="/daily" onClick={() => play("click")}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white rounded-2xl border-[1.5px] border-card-border shadow-card p-4 flex flex-col items-start gap-2"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="font-heading font-bold text-sm text-dark">{t[labelKey]}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
