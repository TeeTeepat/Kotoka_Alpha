"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import KokoMascot from "@/components/KokoMascot";
import type { ConversationScenario, ConversationExchange } from "@/lib/mockData";
import { conversationScenarios } from "@/lib/mockData";
import { mascotVariants, type MascotState } from "@/components/animations/mascotVariants";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { ParticleEffect } from "@/components/ParticleEffect";
import ChatBubble from "./ChatBubble";
import WordChip from "./WordChip";

interface ConversationSessionProps {
  scenarioId: string;
}

export default function ConversationSession({ scenarioId }: ConversationSessionProps) {
  const router = useRouter();
  const { play } = useSoundPlayer();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scenario = conversationScenarios.find((s) => s.id === scenarioId);
  const [messages, setMessages] = useState<ConversationExchange[]>([]);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [detectedWords, setDetectedWords] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [userInput, setUserInput] = useState("");

  // Initialize with first Koko message
  useEffect(() => {
    if (scenario && messages.length === 0) {
      const firstExchange = scenario.exchanges[0];
      if (firstExchange.role === "koko") {
        setMessages([firstExchange]);
        setCurrentExchangeIndex(1);
      }
    }
  }, [scenario, messages.length]);

  // Auto-advance Koko messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage.role === "user";

    if (!isUserMessage || !scenario) return;

    const timer = setTimeout(() => {
      const nextExchange = scenario.exchanges[currentExchangeIndex];
      if (nextExchange && nextExchange.role === "koko") {
        setMessages((prev) => [...prev, nextExchange]);
        setCurrentExchangeIndex((prev) => prev + 1);
        setMascotState("encouraging");
        setTimeout(() => setMascotState("idle"), 500);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [messages, currentExchangeIndex, scenario]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check for completion
  useEffect(() => {
    if (!scenario) return;
    const totalUserMessages = scenario.exchanges.filter((e) => e.role === "user").length;
    if (userMessageCount >= totalUserMessages && !isComplete) {
      setIsComplete(true);
      setMascotState("celebrating");
      setParticleTrigger(true);
      play("fanfare");
    }
  }, [userMessageCount, scenario, isComplete, play]);

  const handleSendMessage = useCallback(() => {
    if (!userInput.trim() || !scenario || isComplete) return;

    const newUserMessage: ConversationExchange = {
      role: "user",
      message: userInput,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setUserMessageCount((prev) => prev + 1);

    // Check for target words
    const lowerMessage = userInput.toLowerCase();
    const newDetectedWords = new Set(detectedWords);

    scenario.targetWords.forEach((word) => {
      if (lowerMessage.includes(word.toLowerCase()) && !detectedWords.has(word)) {
        newDetectedWords.add(word);
        play("correct");
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 500);
      }
    });

    setDetectedWords(newDetectedWords);
    setMascotState("excited");
    setTimeout(() => setMascotState("idle"), 500);
    setUserInput("");
  }, [userInput, scenario, detectedWords, isComplete, play]);

  if (!scenario) {
    return (
      <div className="py-4">
        <p className="font-body text-center text-gray-400">Scenario not found</p>
      </div>
    );
  }

  const allWordsDetected = detectedWords.size === scenario.targetWords.length;

  return (
    <div className="py-4 space-y-4 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/review/conversation")}
          className="w-9 h-9 rounded-full bg-white border-[1.5px] border-card-border shadow-card flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 text-dark" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-extrabold text-base text-dark truncate">Conversation</h1>
          <p className="font-body text-xs text-gray-400 truncate">{scenario.title}</p>
        </div>
      </div>

      {/* Target Words */}
      <div className="flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {scenario.targetWords.map((word) => (
            <WordChip key={word} word={word} detected={detectedWords.has(word)} />
          ))}
          {allWordsDetected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-gold/20 text-gold border border-gold font-body text-sm font-medium"
            >
              🎉 All words!
            </motion.div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 relative">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} message={msg.message} index={index} />
          ))}
        </AnimatePresence>

        {/* Koko Mascot - Small, top-left of chat */}
        <div className="absolute top-0 left-0 z-10">
          <KokoMascot
            state={mascotState}
            variants={mascotVariants}
            animate={mascotState}
            className="w-16 h-16"
          />
        </div>

        <div ref={scrollRef} />
      </div>

      {/* User Input */}
      {!isComplete && (
        <div className="flex-shrink-0 card-base p-3 flex items-center gap-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 bg-transparent font-body text-sm text-dark placeholder:text-gray-400 resize-none outline-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!userInput.trim()}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-btn-aqua"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      )}

      {/* Completion Modal */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="card-base p-6 max-w-sm w-full flex flex-col items-center gap-4 text-center relative"
            >
              <ParticleEffect type="confetti" trigger={particleTrigger} position="center" />

              <KokoMascot
                state="celebrating"
                variants={mascotVariants}
                animate="celebrating"
                className="w-24 h-24"
              />

              <div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-heading font-extrabold text-2xl text-dark"
                >
                  🎉 Great Job!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-body text-sm text-gray-500 mt-1"
                >
                  You completed the conversation!
                </motion.p>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="flex items-center gap-2 bg-gold/10 text-gold font-heading font-extrabold text-lg px-6 py-3 rounded-full"
              >
                🪙 +15 coins
              </motion.div>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/review/conversation")}
                className="btn-aqua w-full py-3.5 font-heading font-extrabold"
              >
                Back to Scenarios
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
