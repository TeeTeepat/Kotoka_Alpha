"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import Image from "next/image";
import type { WordData, SkillResult, SessionState } from "@/types";
import ChoiceButtons from "@/components/conversation/ChoiceButtons";

interface ConversationSkillProps {
  words: WordData[];
  exercisePrompts: SessionState["exercisePrompts"];
  onComplete: (result: SkillResult) => void;
  onWrongAnswer?: () => void;
}

interface Message { role: "user" | "ai"; text: string; streaming?: boolean; }

function WordTokens({
  text,
  msgIdx,
  onTap,
}: {
  text: string;
  msgIdx: number;
  onTap: (word: string, msgIdx: number, wordIdx: number) => void;
}) {
  return (
    <p className="font-body text-sm leading-relaxed flex flex-wrap gap-x-0.5">
      {text.split(/(\s+)/).map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}> </span>;
        return (
          <button
            key={i}
            onClick={() => {
              const clean = token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
              if (clean) onTap(clean, msgIdx, i);
            }}
            className="hover:bg-primary/20 rounded transition-colors cursor-pointer"
          >
            {token}
          </button>
        );
      })}
    </p>
  );
}

export default function ConversationSkill({ words, exercisePrompts, onComplete }: ConversationSkillProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: exercisePrompts.conversation ||
        `Let's practice! Try using one of these words: ${words.slice(0, 3).map(w => w.word).join(", ")}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [exchanges, setExchanges] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [tooltip, setTooltip] = useState<{ word: string; translation: string; msgIdx: number; wordIdx: number } | null>(null);
  const [choiceData, setChoiceData] = useState<{ texts: string[]; correctIndex: number } | null>(null);
  const [choicesLoading, setChoicesLoading] = useState(false);
  const correctChoicesRef = useRef(0);
  const totalChoicesRef = useRef(0);
  const maxExchanges = 3;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Fetch choices for the opening AI message on mount
  useEffect(() => {
    const openingText = exercisePrompts.conversation ||
      `Let's practice! Try using one of these words: ${words.slice(0, 3).map(w => w.word).join(", ")}.`;
    setChoicesLoading(true);
    fetch("/api/conversation/choices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiReply: openingText, wordList: words.map(w => w.word) }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.choices) setChoiceData({ texts: data.choices, correctIndex: data.correctIndex ?? 0 });
      })
      .catch(() => {})
      .finally(() => setChoicesLoading(false));
  // words and exercisePrompts are stable props — intentionally run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWordTap = async (word: string, msgIdx: number, wordIdx: number) => {
    if (!word) return;
    if (tooltip?.msgIdx === msgIdx && tooltip?.wordIdx === wordIdx) {
      setTooltip(null);
      return;
    }
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: word, targetLang: "th" }),
      });
      if (res.ok) {
        const data = await res.json();
        setTooltip({ word, translation: data.translation, msgIdx, wordIdx });
      }
    } catch { /* silent */ }
  };

  const send = async (overrideText?: string) => {
    const userText = overrideText ?? input.trim();
    if (!userText || isTyping || exchanges >= maxExchanges) return;
    setChoiceData(null);

    // Build history snapshot before state update
    const historySnapshot = messages.map(m => ({
      role: m.role === "ai" ? "model" : "user",
      text: m.text,
    }));

    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setInput("");
    setTooltip(null);

    const newExchanges = exchanges + 1;
    setExchanges(newExchanges);
    setIsTyping(true);

    try {
      const res = await fetch("/api/conversation/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          history: historySnapshot,
          wordList: words.map(w => w.word),
        }),
      });

      if (res.status === 429) {
        setMessages(prev => [...prev, { role: "ai", text: "I'm a bit busy right now — please wait a few seconds and try again! 🙏" }]);
        setIsTyping(false);
        return;
      }
      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      setMessages(prev => [...prev, { role: "ai", text: "", streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming) return [...prev.slice(0, -1), { ...last, text }];
          return prev;
        });
      }

      setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));

      if (newExchanges >= maxExchanges) {
        // Session done — trigger completion, skip choices fetch
        const vocabUsed = words.filter(w => userText.toLowerCase().includes(w.word.toLowerCase())).map(w => w.word);
        setTimeout(() => {
          onComplete({
            skill: "conversation",
            correct: correctChoicesRef.current,
            total: Math.max(totalChoicesRef.current, 1),
            vocabularyUsed: vocabUsed,
          });
        }, 1200);
      } else {
        // Fetch choices for next turn
        setChoicesLoading(true);
        try {
          const choicesRes = await fetch("/api/conversation/choices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aiReply: text, wordList: words.map(w => w.word) }),
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
      setMessages(prev => [...prev, {
        role: "ai",
        text: "⚠️ Conversation practice is in Beta and encountered an issue. Skipping this exercise — we'll have it fixed soon!",
      }]);
      setTimeout(() => {
        onComplete({ skill: "conversation", correct: 0, total: 1, vocabularyUsed: [] });
      }, 2000);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-4">
      {words[0]?.deckImage && (
        <div className="relative h-16 overflow-hidden rounded-2xl">
          <Image src={`data:image/jpeg;base64,${words[0].deckImage}`} alt="Scene" fill className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-heading font-extrabold text-sm text-dark">Conversation Practice</h3>
        <span className="text-xs font-body text-gray-400">{exchanges}/{maxExchanges} exchanges</span>
      </div>

      <div ref={scrollRef} className="h-64 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
              msg.role === "user"
                ? "bg-primary text-white rounded-br-sm"
                : "bg-gray-100 text-dark rounded-bl-sm"
            }`}>
              {msg.role === "ai" && !msg.streaming ? (
                <WordTokens text={msg.text} msgIdx={i} onTap={handleWordTap} />
              ) : (
                <p className="font-body text-sm leading-relaxed">
                  {msg.text}
                  {msg.streaming && (
                    <span className="inline-block w-1 h-3 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              )}
              <AnimatePresence>
                {tooltip?.msgIdx === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="mt-2 px-2 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    <p className="font-body text-xs text-gray-500">
                      <span className="font-bold text-dark">{tooltip.word}</span>
                      {" → "}
                      {tooltip.translation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {isTyping && !messages[messages.length - 1]?.streaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {choiceData ? (
        <ChoiceButtons
          choices={choiceData.texts}
          correctIndex={choiceData.correctIndex}
          disabled={exchanges >= maxExchanges || isTyping}
          onSelect={(choice, isCorrect) => {
            totalChoicesRef.current += 1;
            if (isCorrect) correctChoicesRef.current += 1;
            setChoiceData(null);
            send(choice);
          }}
          onFallback={() => setChoiceData(null)}
        />
      ) : choicesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={exchanges >= maxExchanges ? "Session complete!" : "Type your response…"}
            disabled={exchanges >= maxExchanges || isTyping}
            className="flex-1 border-2 border-card-border rounded-2xl px-4 py-3 font-body text-sm text-dark focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => send()}
            disabled={!input.trim() || exchanges >= maxExchanges || isTyping}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
