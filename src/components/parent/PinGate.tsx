"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";

// ponytail: demo-grade PIN gate — localStorage only, no server enforcement.
// Kid-proof (stops casual poking around), not adult-proof. Upgrade path:
// move the PIN check server-side once there's a real parent account model.
const PIN_KEY = "kotoka:parent:pin";
const PIN_LENGTH = 4;

function usePin() {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStoredPin(window.localStorage.getItem(PIN_KEY));
    setReady(true);
  }, []);

  const savePin = (pin: string) => {
    window.localStorage.setItem(PIN_KEY, pin);
    setStoredPin(pin);
  };

  return { storedPin, savePin, ready };
}

function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
            i < filled ? "bg-primary border-primary" : "border-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function Keypad({ onDigit, onBackspace }: { onDigit: (d: string) => void; onBackspace: () => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
      {keys.map((k, i) =>
        k === "" ? (
          <div key={i} />
        ) : (
          <motion.button
            key={i}
            whileTap={{ scale: 0.92 }}
            onClick={() => (k === "back" ? onBackspace() : onDigit(k))}
            className="h-16 rounded-2xl bg-white border border-gray-200 shadow-sm text-xl font-semibold text-gray-700 hover:bg-gray-50"
          >
            {k === "back" ? "⌫" : k}
          </motion.button>
        )
      )}
    </div>
  );
}

export default function PinGate({ children }: { children: React.ReactNode }) {
  const { storedPin, savePin, ready } = usePin();
  const [mode, setMode] = useState<"enter" | "set" | "confirm">("enter");
  const [input, setInput] = useState("");
  const [pendingPin, setPendingPin] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (ready) setMode(storedPin ? "enter" : "set");
  }, [ready, storedPin]);

  const handleDigit = (d: string) => {
    if (input.length >= PIN_LENGTH) return;
    const next = input + d;
    setInput(next);
    setError("");
    if (next.length !== PIN_LENGTH) return;

    if (mode === "set") {
      setPendingPin(next);
      setMode("confirm");
      setInput("");
    } else if (mode === "confirm") {
      if (next === pendingPin) {
        savePin(next);
        setUnlocked(true);
      } else {
        setError("PINs didn't match — try again.");
        setMode("set");
        setPendingPin("");
        setInput("");
      }
    } else if (mode === "enter") {
      if (next === storedPin) {
        setUnlocked(true);
      } else {
        setError("Wrong PIN.");
        setInput("");
      }
    }
  };

  if (!ready) return null;
  if (unlocked) return <>{children}</>;

  const title =
    mode === "set" ? "Set a parent PIN" : mode === "confirm" ? "Confirm your PIN" : "Enter parent PIN";
  const subtitle =
    mode === "set"
      ? "This keeps the Parent tab away from curious little hands."
      : mode === "confirm"
        ? "One more time to make sure."
        : "This area is for parents.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-slate-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          {mode === "set" || mode === "confirm" ? (
            <ShieldCheck className="w-7 h-7 text-primary" />
          ) : (
            <Lock className="w-7 h-7 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <PinDots length={PIN_LENGTH} filled={input.length} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Keypad onDigit={handleDigit} onBackspace={() => setInput((s) => s.slice(0, -1))} />
      </motion.div>
    </div>
  );
}
