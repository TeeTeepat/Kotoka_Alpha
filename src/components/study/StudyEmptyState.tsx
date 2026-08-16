"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import KokoMascot from "@/components/KokoMascot";
import { useLocale } from "@/lib/i18n";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";

/** Shown when a child has no promoted words due yet — points them to /daily to earn some. */
export default function StudyEmptyState() {
  const { t } = useLocale();
  const { play } = useSoundPlayer();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 py-12 text-center"
    >
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <KokoMascot state="idle" className="w-36 h-36" />
      </motion.div>
      <div className="space-y-2">
        <h2 className="font-heading font-extrabold text-xl text-dark">{t.studyEmptyTitle}</h2>
        <p className="font-body text-sm text-gray-400 max-w-[260px]">{t.studyEmptySubtitle}</p>
      </div>
      <Link href="/daily" onClick={() => play("click")}>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-aqua px-6 py-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {t.studyEmptyCta}
        </motion.button>
      </Link>
    </motion.div>
  );
}
