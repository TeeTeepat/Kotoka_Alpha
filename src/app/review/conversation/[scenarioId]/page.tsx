"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, Sparkles, MessageCircle } from "lucide-react";
import KokoMascot from "@/components/KokoMascot";
import { conversationScenarios } from "@/lib/mockData";
import { ParticleEffect } from "@/components/ParticleEffect";
import ChoiceButtons from "@/components/conversation/ChoiceButtons";
import { useLocale } from "@/lib/i18n";

interface ChatMessage {
  role: "koko" | "user";
  message: string;
  streaming?: boolean;
}

interface ChoiceData {
  texts: string[];
  correctIndex: number;
}

interface CompletionStats {
  coinsEarned: number;
  accuracy: number;
  durationSec: number;
}

const MAX_EXCHANGES = 4;

export default function ConversationSessionPage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { t } = useLocale();
  const { scenarioId } = use(params);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<{ role: string; text: string }[]>([]);
  const startTimeRef = useRef<number>(0);
  const correctChoicesRef = useRef(0);
  const totalChoicesRef = useRef(0);

  const scenario = conversationScenarios.find(s => s.id === scenarioId);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [wordsCompleted, setWordsCompleted] = useState<string[]>([]);
  const [exchangeNumber, setExchangeNumber] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [choiceData, setChoiceData] = useState<ChoiceData | null>(null);
  const [choicesLoading, setChoicesLoading] = useState(false);
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!scenario) return;
    fetch("/api/conversation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_type: scenario.id }),
    })
      .then(r => r.json())
      .then(async data => {
        setConversationId(data.conversation_id);
        setMessages([{ role: "koko", message: data.opening_message }]);
        historyRef.current = [{ role: "model", text: data.opening_message }];
        startTimeRef.current = Date.now();
        setIsStarting(false);

        setChoicesLoading(true);
        try {
          const choicesRes = await fetch("/api/conversation/choices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aiReply: data.opening_message, wordList: scenario?.targetWords ?? [] }),
          });
          if (choicesRes.ok) {
            const { choices: texts, correctIndex } = await choicesRes.json();
            setChoiceData({ texts, correctIndex });
          }
        } catch { /* silent */ } finally {
          setChoicesLoading(false);
        }
      })
      .catch(() => {
        const fallback = scenario.exchanges[0]?.message ?? "Hello! Ready to practice?";
        setMessages([{ role: "koko", message: fallback }]);
        historyRef.current = [{ role: "model", text: fallback }];
        startTimeRef.current = Date.now();
        setIsStarting(false);
      });
  }, [scenario]);

  const handleChoiceSelect = (choice: string, isCorrect?: boolean) => {
    totalChoicesRef.current += 1;
    if (isCorrect) correctChoicesRef.current += 1;
    setChoiceData(null);
    handleSend(choice);
  };

  const handleSend = async (overrideText?: string) => {
    const userMessage = overrideText ?? input.trim();
    if (!userMessage || sending || sessionComplete) return;
    setChoiceData(null);
    setInput("");
    setSending(true);

    const historySnapshot = [...historyRef.current];
    setMessages(prev => [...prev, { role: "user", message: userMessage }]);

    const usedWords = (scenario?.targetWords ?? []).filter(w =>
      userMessage.toLowerCase().includes(w.toLowerCase())
    );
    if (usedWords.length > 0) {
      setWordsCompleted(prev => [...new Set([...prev, ...usedWords])]);
    }

    const newExchangeNum = exchangeNumber + 1;
    setExchangeNumber(newExchangeNum);

    try {
      const res = await fetch("/api/conversation/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          history: historySnapshot,
          wordList: scenario?.targetWords ?? [],
        }),
      });

      if (res.status === 429) {
        setMessages(prev => [...prev, { role: "koko", message: "I'm a bit busy right now — please wait a few seconds and try again! 🙏" }]);
        setSending(false);
        return;
      }
      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let kokoReply = "";

      setMessages(prev => [...prev, { role: "koko", message: "", streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        kokoReply += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming) return [...prev.slice(0, -1), { ...last, message: kokoReply }];
          return prev;
        });
      }

      setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
      historyRef.current = [
        ...historyRef.current,
        { role: "user", text: userMessage },
        { role: "model", text: kokoReply },
      ];

      if (newExchangeNum >= MAX_EXCHANGES) {
        setSessionComplete(true);
        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        const allWordsUsed = [...new Set([...wordsCompleted, ...usedWords])];

        if (conversationId) {
          try {
            const completeRes = await fetch("/api/conversation/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId,
                correctChoices: correctChoicesRef.current,
                totalChoices: totalChoicesRef.current,
                wordsPracticed: allWordsUsed,
                durationSec,
              }),
            });
            if (completeRes.ok) {
              const { coinsEarned, accuracy } = await completeRes.json();
              setCompletionStats({ coinsEarned, accuracy, durationSec });
            } else {
              const acc = totalChoicesRef.current > 0 ? correctChoicesRef.current / totalChoicesRef.current : 0;
              setCompletionStats({ coinsEarned: 10, accuracy: acc, durationSec });
            }
          } catch {
            const acc = totalChoicesRef.current > 0 ? correctChoicesRef.current / totalChoicesRef.current : 0;
            setCompletionStats({ coinsEarned: 10, accuracy: acc, durationSec });
          }
        }

        setTimeout(() => setShowCelebration(true), 500);
      } else {
        setChoicesLoading(true);
        try {
          const choicesRes = await fetch("/api/conversation/choices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aiReply: kokoReply, wordList: scenario?.targetWords ?? [] }),
          });
          if (choicesRes.ok) {
            const { choices: texts, correctIndex } = await choicesRes.json();
            setChoiceData({ texts, correctIndex });
          } else {
            setChoiceData(null);
          }
        } catch {
          setChoiceData(null);
        } finally {
          setChoicesLoading(false);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "koko", message: "Great answer! Keep going!" }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (!scenario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-body text-gray-500">Scenario not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ParticleEffect type="confetti" trigger={showCelebration} position="center" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-card-border px-4 py-3"
      >
        <div className="flex items-center gap-3 max-w-[480px] mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-card-border flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-dark" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-extrabold text-sm text-dark truncate">
              {scenario.emoji} {scenario.title}
            </p>
            <p className="font-body text-xs text-gray-500 truncate">
              Target: {scenario.targetWords.slice(0, 3).join(", ")}...
            </p>
          </div>
          <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
        </div>

        {/* Word chips */}
        <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 max-w-[480px] mx-auto scrollbar-hide">
          {scenario.targetWords.map(word => (
            <motion.div
              key={word}
              animate={wordsCompleted.includes(word) ? { scale: [1, 1.2, 1] } : {}}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0 transition-all ${
                wordsCompleted.includes(word)
                  ? "bg-emerald-100 border-emerald-300 border"
                  : "bg-gray-100 border-gray-200 border"
              }`}
            >
              {wordsCompleted.includes(word) && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              <span className={`font-body text-xs font-medium ${wordsCompleted.includes(word) ? "text-emerald-700" : "text-gray-600"}`}>
                {word}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-[480px] mx-auto w-full">
        {isStarting ? (
          <div className="flex items-center gap-3 justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="font-body text-sm text-gray-500">Koko is getting ready...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "koko" && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-0.5">
                    <KokoMascot state="greeting" className="w-full h-full" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl font-body text-sm leading-relaxed ${
                    msg.role === "koko"
                      ? "bg-white border border-card-border text-dark rounded-bl-sm"
                      : "bg-primary text-white rounded-br-sm"
                  }`}
                >
                  {msg.message}
                  {msg.streaming && (
                    <span className="inline-block w-1 h-3 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {sending && !messages[messages.length - 1]?.streaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <KokoMascot state="thinking" className="w-full h-full" />
            </div>
            <div className="bg-white border border-card-border px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-gray-300 rounded-full"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-t border-card-border px-4 py-3"
      >
        {sessionComplete ? null : choiceData ? (
          <div className="max-w-[480px] mx-auto w-full">
            <ChoiceButtons
              choices={choiceData.texts}
              correctIndex={choiceData.correctIndex}
              disabled={sending}
              onSelect={handleChoiceSelect}
              onFallback={() => setChoiceData(null)}
            />
          </div>
        ) : choicesLoading ? (
          <div className="space-y-2 max-w-[480px] mx-auto w-full">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="flex gap-2 max-w-[480px] mx-auto">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={t.conversationPlaceholder}
              disabled={sending || sessionComplete}
              className="flex-1 px-4 py-3 rounded-2xl border-[1.5px] border-card-border bg-white font-body text-sm text-dark placeholder-gray-300 outline-none focus:border-primary transition-colors disabled:opacity-60"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || sending || sessionComplete}
              className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Completion modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl mb-3"
                >
                  🎉
                </motion.div>
                <h2 className="font-heading font-extrabold text-2xl text-dark">Conversation Complete!</h2>
                <p className="font-body text-sm text-gray-500 mt-1">
                  {MAX_EXCHANGES} exchanges done
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                  className="bg-primary/10 rounded-2xl p-3 text-center"
                >
                  <p className="font-heading font-extrabold text-xl text-primary">
                    {completionStats ? `${Math.round(completionStats.accuracy * 100)}%` : "—"}
                  </p>
                  <p className="font-body text-xs text-gray-500 mt-0.5">Accuracy</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                  className="bg-amber-50 rounded-2xl p-3 text-center"
                >
                  <p className="font-heading font-extrabold text-xl text-amber-500">
                    +{completionStats?.coinsEarned ?? "—"}
                  </p>
                  <p className="font-body text-xs text-gray-500 mt-0.5">Coins</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }}
                  className="bg-emerald-50 rounded-2xl p-3 text-center"
                >
                  <p className="font-heading font-extrabold text-xl text-emerald-600">
                    {wordsCompleted.length}/{scenario.targetWords.length}
                  </p>
                  <p className="font-body text-xs text-gray-500 mt-0.5">Words used</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
                  className="bg-gray-50 rounded-2xl p-3 text-center"
                >
                  <p className="font-heading font-extrabold text-xl text-dark">
                    {completionStats
                      ? `${Math.floor(completionStats.durationSec / 60)}m ${completionStats.durationSec % 60}s`
                      : "—"}
                  </p>
                  <p className="font-body text-xs text-gray-500 mt-0.5">Time</p>
                </motion.div>
              </div>

              {/* Words used */}
              {wordsCompleted.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {wordsCompleted.map(w => (
                    <span key={w} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-body text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {w}
                    </span>
                  ))}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/review/conversation")}
                className="w-full btn-aqua py-3.5 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Try Another Scenario
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
