"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import type { DeckWithWords } from "@/types";

type Difficulty = "easy" | "medium" | "hard";
type Message = { role: "user" | "model"; content: string };

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; desc: string; color: string }> = {
  easy:   { label: "Easy",   desc: "Native lang + target words",    color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  medium: { label: "Medium", desc: "Scaffolded target language",    color: "bg-amber-100 text-amber-700 border-amber-300" },
  hard:   { label: "Hard",   desc: "Full immersion target language", color: "bg-red-100 text-red-600 border-red-300" },
};

function ChatSession({
  deck, difficulty, nativeLanguage, learningLanguage, onExit,
}: {
  deck: DeckWithWords; difficulty: Difficulty; nativeLanguage: string; learningLanguage: string; onExit: () => void;
}) {
  const knownWords = deck.words.map(w => w.word);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kick off first Koko message on mount
  useEffect(() => {
    sendMessage("Hello! Let's practice.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/review/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, difficulty, knownWords, nativeLanguage, learningLanguage }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "model", content: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Sorry, something went wrong. Try again!" }]);
    } finally {
      setSending(false);
    }
  };

  const cfg = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Difficulty badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-heading font-extrabold px-3 py-1 rounded-full border ${cfg.color}`}>
          {cfg.label}: {cfg.desc}
        </span>
        <span className="text-xs font-body text-gray-400 truncate">· {deck.sceneDesc}</span>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-white border border-card-border text-dark rounded-bl-sm shadow-card"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {sending && (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white border border-card-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 pt-3 border-t border-card-border">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !sending && input.trim() && sendMessage(input.trim())}
          disabled={sending}
          placeholder="Type your message..."
          className="flex-1 border-2 border-card-border rounded-2xl px-4 py-2.5 font-body text-sm text-dark focus:outline-none focus:border-primary transition-colors"
        />
        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          onClick={() => input.trim() && sendMessage(input.trim())}
          disabled={sending || !input.trim()}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 flex-shrink-0">
          <Send className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </div>
  );
}

export default function ReadWritePage() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckWithWords[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<DeckWithWords | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [started, setStarted] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState("Thai");
  const [learningLanguage, setLearningLanguage] = useState("English");

  useEffect(() => {
    fetch("/api/decks").then(r => r.json()).then(d => { setDecks(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/user").then(r => r.ok ? r.json() : null).then(u => {
      if (u?.targetLanguage) setNativeLanguage(u.targetLanguage);
      if (u?.learningLanguage) setLearningLanguage(u.learningLanguage);
    });
  }, []);

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center gap-3">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => started ? setStarted(false) : router.push("/review")}
          className="w-9 h-9 rounded-full bg-white border-[1.5px] border-card-border shadow-card flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-dark" />
        </motion.button>
        <div>
          <h1 className="font-heading font-extrabold text-xl text-dark">Read & Write</h1>
          <p className="font-body text-sm text-gray-500">
            {started ? `${difficulty} · ${selectedDeck?.sceneDesc}` : "AI Conversation"}
          </p>
        </div>
      </div>

      {started && selectedDeck ? (
        <ChatSession deck={selectedDeck} difficulty={difficulty}
          nativeLanguage={nativeLanguage} learningLanguage={learningLanguage}
          onExit={() => setStarted(false)} />
      ) : (
        <div className="space-y-5">
          {/* Difficulty */}
          <div>
            <p className="font-heading font-extrabold text-sm text-dark mb-2">Difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map(d => {
                const cfg = DIFFICULTY_CONFIG[d];
                return (
                  <motion.button key={d} whileTap={{ scale: 0.96 }}
                    onClick={() => setDifficulty(d)}
                    className={`py-2.5 px-3 rounded-2xl border-2 font-heading font-extrabold text-sm transition-all ${
                      difficulty === d ? cfg.color + " border-current" : "border-card-border text-gray-400"
                    }`}>
                    {cfg.label}
                  </motion.button>
                );
              })}
            </div>
            <p className="font-body text-xs text-gray-400 mt-1.5">{DIFFICULTY_CONFIG[difficulty].desc}</p>
          </div>

          {/* Deck selection */}
          <div>
            <p className="font-heading font-extrabold text-sm text-dark mb-2">Choose a deck</p>
            {loading ? (
              <div className="space-y-2">{[1, 2].map(i => <div key={i} className="card-base h-14 animate-pulse" />)}</div>
            ) : decks.length === 0 ? (
              <div className="card-base p-6 text-center">
                <p className="font-body text-sm text-gray-400">No decks yet. Snap a photo first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {decks.map((deck, i) => (
                  <motion.button key={deck.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedDeck(deck)}
                    className={`w-full card-base p-3.5 text-left flex items-center gap-3 transition-all ${
                      selectedDeck?.id === deck.id ? "border-primary shadow-md" : "hover:shadow-card-hover"
                    }`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-heading font-extrabold flex-shrink-0"
                      style={{ background: deck.colorPalette }}>
                      {deck.words.length}
                    </div>
                    <p className="font-body text-sm text-dark capitalize truncate">{deck.sceneDesc}</p>
                    {selectedDeck?.id === deck.id && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => selectedDeck && setStarted(true)}
            disabled={!selectedDeck}
            className="btn-aqua w-full py-4 disabled:opacity-40">
            Start Conversation →
          </motion.button>
        </div>
      )}
    </div>
  );
}
