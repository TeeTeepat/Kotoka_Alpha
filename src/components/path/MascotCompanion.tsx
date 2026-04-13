"use client";

import { motion } from "framer-motion";
import KokoMascot from "@/components/KokoMascot";

export default function MascotCompanion({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ scale: 0, y: 10 }}
      animate={{ scale: 1, y: [0, -4, 0] }}
      transition={{
        scale: { duration: 0.3, type: "spring", stiffness: 400 },
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }}
      className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none"
    >
      <KokoMascot state="idle" className="w-9 h-9" />
    </motion.div>
  );
}
