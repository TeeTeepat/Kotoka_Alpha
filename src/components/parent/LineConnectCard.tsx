"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, CheckCircle2, ExternalLink, Loader2, QrCode } from "lucide-react";

interface PairStatus {
  connected: boolean;
  code: string | null;
  expiresAt: string | null;
}

const ADD_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || null;

export default function LineConnectCard() {
  const [status, setStatus] = useState<PairStatus | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    return fetch("/api/line/pair")
      .then((r) => r.json())
      .then((data: PairStatus) => {
        setStatus(data);
        return data;
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll every 5s while a pairing code is active and not yet connected.
  useEffect(() => {
    const codeActive = !!status?.code && !status.connected;
    if (!codeActive) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const data = await refresh();
      if (data?.connected && pollRef.current) {
        clearInterval(pollRef.current);
        setToast({ ok: true, message: "Connected!" });
      }
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status?.code, status?.connected, refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const getCode = async () => {
    setRequesting(true);
    try {
      const res = await fetch("/api/line/pair", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus((s) => ({ connected: s?.connected ?? false, code: data.code, expiresAt: data.expiresAt }));
      } else {
        setToast({ ok: false, message: "Couldn't get a code — try again." });
      }
    } catch {
      setToast({ ok: false, message: "Network error — couldn't reach the server." });
    } finally {
      setRequesting(false);
    }
  };

  const sendTest = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/line/test", { method: "POST" });
      const data = await res.json();
      setToast(
        res.ok
          ? { ok: true, message: "Sent! Check your LINE app." }
          : { ok: false, message: data.error ?? "Send failed." }
      );
    } catch {
      setToast({ ok: false, message: "Network error — couldn't reach the server." });
    } finally {
      setSending(false);
    }
  };

  const connected = status?.connected ?? false;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 relative">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#06C755]/10 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4.5 h-4.5 text-[#06C755]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">LINE reports</p>
          <p className="text-xs text-gray-500">
            {status === null
              ? "Checking setup…"
              : connected
                ? "Connected — reports push automatically."
                : "Not connected yet."}
          </p>
        </div>
        {status !== null && connected && <CheckCircle2 className="w-5 h-5 text-[#06C755] shrink-0" />}
      </div>

      {!connected && status !== null && !status.code && (
        <div className="space-y-2">
          {ADD_FRIEND_URL && (
            <a
              href={ADD_FRIEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3 hover:bg-gray-100"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>Step 1: add the Kotoka bot as a LINE friend</span>
              <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
            </a>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={requesting}
            onClick={getCode}
            className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-[#06C755] text-white hover:opacity-90 disabled:opacity-60"
          >
            {requesting && <Loader2 className="w-4 h-4 animate-spin" />}
            Get pairing code
          </motion.button>
        </div>
      )}

      {!connected && status?.code && (
        <div className="space-y-2 text-center">
          <p className="text-xs text-gray-500">
            In your LINE chat with the bot, send this code:
          </p>
          <p className="text-3xl font-bold tracking-[0.3em] text-gray-800 bg-gray-50 rounded-xl py-3">
            {status.code}
          </p>
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Waiting for you to send it…
          </p>
        </div>
      )}

      {connected && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={sending}
          onClick={sendTest}
          className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-[#06C755] text-white hover:opacity-90 disabled:opacity-60"
        >
          {sending && <Loader2 className="w-4 h-4 animate-spin" />}
          Send test report
        </motion.button>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`absolute left-3 right-3 -bottom-3 translate-y-full rounded-xl px-3 py-2 text-xs font-medium shadow-lg z-10 ${
              toast.ok ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
