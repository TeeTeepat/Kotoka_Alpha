"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Only show once per browser session
    if (sessionStorage.getItem("kotoka-splash")) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem("kotoka-splash", "1");

    let appReady = false;
    let minElapsed = false;
    const tryHide = () => { if (appReady && minElapsed) setVisible(false); };

    // Minimum display time so splash never flashes too briefly
    const minTimer = setTimeout(() => { minElapsed = true; tryHide(); }, 6500);

    // Wait for the app to signal it's done loading
    const onReady = () => { appReady = true; tryHide(); };
    window.addEventListener("kotoka-app-ready", onReady);

    // Safety fallback — never block longer than 6s
    const fallback = setTimeout(() => setVisible(false), 6000);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fallback);
      window.removeEventListener("kotoka-app-ready", onReady);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-4"
        >
          {/* Logo pulse-in */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Image
              src="/logo.png"
              alt="Kotoka"
              width={88}
              height={88}
              className="rounded-[24px] shadow-xl"
              priority
            />
          </motion.div>

          {/* App name fades in slightly after logo */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="font-heading font-extrabold text-xl text-dark tracking-tight"
          >
            Kotoka
          </motion.p>

          {/* Subtle loader dots at bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-16 flex gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, type: "tween" }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
