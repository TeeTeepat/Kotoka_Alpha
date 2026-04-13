"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, ChevronRight } from "lucide-react";
import { conversationScenarios } from "@/lib/mockData";
import { useLocale } from "@/lib/i18n";

export default function ConversationScenarioPickerPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleStart = (id: string) => {
    setSelected(id);
    setTimeout(() => router.push(`/review/conversation/${id}`), 200);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-card-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-[480px] mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-card-border flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-heading font-extrabold text-lg text-dark">{t.conversationTitle}</h1>
            <p className="font-body text-xs text-gray-500">{t.conversationInstruction}</p>
          </div>
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
      </motion.div>

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-3">
        {/* Koko intro banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-base p-4 bg-primary/5 border-primary/20 flex items-center gap-3"
        >
          <span className="text-3xl">🐦</span>
          <div>
            <p className="font-heading font-bold text-sm text-dark">Koko is ready to chat!</p>
            <p className="font-body text-xs text-gray-500">Use your target words naturally to complete each scenario.</p>
          </div>
        </motion.div>

        {/* Scenario cards */}
        {conversationScenarios.map((scenario, i) => (
          <motion.button
            key={scenario.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStart(scenario.id)}
            disabled={selected === scenario.id}
            className="w-full card-base p-4 text-left flex items-center gap-4 disabled:opacity-70"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
              {scenario.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-dark">{scenario.title}</p>
              <p className="font-body text-xs text-gray-500 mt-0.5 truncate">{scenario.description}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {scenario.targetWords.slice(0, 3).map(w => (
                  <span key={w} className="px-2 py-0.5 bg-gray-100 rounded-full font-body text-[10px] text-gray-600">
                    {w}
                  </span>
                ))}
                {scenario.targetWords.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full font-body text-[10px] text-gray-400">
                    +{scenario.targetWords.length - 3}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
