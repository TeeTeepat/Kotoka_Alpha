"use client";

import { motion } from "framer-motion";
import KokoMascot from "@/components/KokoMascot";

interface ChatBubbleProps {
  role: "koko" | "user";
  message: string;
  index: number;
}

const bubbleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
};

export default function ChatBubble({ role, message, index }: ChatBubbleProps) {
  const isKoko = role === "koko";

  return (
    <motion.div
      key={index}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={`flex gap-3 ${isKoko ? "flex-row" : "flex-row-reverse"}`}
    >
      {isKoko && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
          <KokoMascot state="greeting" className="w-full h-full" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isKoko
            ? "bg-gradient-to-br from-cyan-50 to-teal-50 text-dark"
            : "bg-white border-[1.5px] border-card-border text-dark"
        }`}
      >
        <p className="font-body text-sm leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}
