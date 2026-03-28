"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, MessageSquare, Mic, Headphones } from "lucide-react";

const MODES = [
  {
    href: "/review/flashcards",
    icon: Layers,
    title: "Flashcards",
    subtitle: "Spaced Repetition",
    description: "SM-2 algorithm adapts to your memory",
    color: "#1ad3e2",
    bg: "from-cyan-50 to-teal-50",
    border: "border-cyan-200",
  },
  {
    href: "/review/read-write",
    icon: MessageSquare,
    title: "Read & Write",
    subtitle: "AI Conversation",
    description: "Chat with Koko in your target language",
    color: "#8b5cf6",
    bg: "from-violet-50 to-purple-50",
    border: "border-violet-200",
  },
  {
    href: "/review/pronunciation",
    icon: Mic,
    title: "Pronunciation",
    subtitle: "Syllable Analysis",
    description: "Heatmap feedback on every syllable",
    color: "#f59e0b",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-200",
  },
  {
    href: "/review/dictation",
    icon: Headphones,
    title: "Dictation",
    subtitle: "Listen & Type",
    description: "Hear the word, spell it correctly",
    color: "#10b981",
    bg: "from-emerald-50 to-green-50",
    border: "border-emerald-200",
  },
];

export default function ReviewPage() {
  const router = useRouter();

  return (
    <div className="py-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-extrabold text-xl text-dark">Practice</h1>
        <p className="font-body text-sm text-gray-500">Choose how you want to study</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {MODES.map((mode, i) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(mode.href)}
              className={`card-base p-4 text-left flex flex-col gap-3 bg-gradient-to-br ${mode.bg} border ${mode.border} hover:shadow-card-hover transition-all`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${mode.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: mode.color }} />
              </div>
              <div>
                <p className="font-heading font-extrabold text-sm text-dark leading-tight">{mode.title}</p>
                <p className="font-body text-[10px] font-medium mt-0.5" style={{ color: mode.color }}>
                  {mode.subtitle}
                </p>
                <p className="font-body text-[10px] text-gray-400 mt-1 leading-tight">{mode.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
