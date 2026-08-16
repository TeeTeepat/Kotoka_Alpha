"use client";

// AR word labels — Google-Lens style pill labels pinned to the frozen snap
// photo. Each pill is one concrete object Koko found. Tapping a pill hears
// the word (TTS), reveals its Thai gloss, and makes sure it's kept — a
// plain tap never drops a word, so the natural "tap each pill to hear it"
// exploration never empties the kept set. A small × on the pill is the
// only way to drop it; tapping a dropped pill's word again re-adds it.
//
// The photo MUST render with object-contain (never object-cover) inside a
// fixed-aspect container — cover crops the image, which would knock every
// pill off the object it's meant to sit on since cropBox is normalized to
// the full, uncropped photo.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { SnapObject } from "@/lib/gemini";

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

interface ARSnapConfirmProps {
  photoUrl: string;
  objects: SnapObject[];
  onConfirm: (kept: SnapObject[]) => void;
}

/** The image's displayed (letterboxed) rect inside its object-contain container, in px. */
interface DisplayRect {
  offsetX: number;
  offsetY: number;
  dispW: number;
  dispH: number;
}

export default function ARSnapConfirm({ photoUrl, objects, onConfirm }: ARSnapConfirmProps) {
  // Koko found these for you — everything starts kept; use each pill's ×
  // to drop it (a plain tap on the pill itself only ever adds).
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(objects.map((_, i) => i))
  );
  const [revealed, setRevealed] = useState<number | null>(null);

  // object-contain letterboxes the photo whenever its aspect ratio differs
  // from the fixed-aspect container (worst case: a portrait photo in this
  // 4:3 box). cropBox is normalized to the full photo, not the container,
  // so pills must be positioned against the actual displayed image rect —
  // not the container — or they drift onto the letterbox bars.
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const displayRect: DisplayRect | null =
    containerSize && imgSize && imgSize.w > 0 && imgSize.h > 0
      ? (() => {
          const scale = Math.min(containerSize.w / imgSize.w, containerSize.h / imgSize.h);
          const dispW = imgSize.w * scale;
          const dispH = imgSize.h * scale;
          return {
            offsetX: (containerSize.w - dispW) / 2,
            offsetY: (containerSize.h - dispH) / 2,
            dispW,
            dispH,
          };
        })()
      : null;

  const tapPill = (i: number) => {
    speak(objects[i].word);
    setRevealed(i);
    // Plain tap only ever adds — hearing every pill must never empty the kept set.
    setSelected((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  const dropPill = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  const kept = objects.filter((_, i) => selected.has(i));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base overflow-hidden"
    >
      <div ref={containerRef} className="relative w-full aspect-[4/3] bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="your find"
          onLoad={handleImgLoad}
          className="w-full h-full object-contain"
        />

        {displayRect &&
          objects.map((obj, i) => {
          const isKept = selected.has(i);
          const centerXpx = displayRect.offsetX + (obj.cropBox.x + obj.cropBox.w / 2) * displayRect.dispW;
          const topYpx = displayRect.offsetY + obj.cropBox.y * displayRect.dispH;
          // Clamp inside the actual displayed image rect so a pill can
          // never land on the letterbox bars even from an edge-case box.
          const left = Math.min(
            Math.max(centerXpx, displayRect.offsetX),
            displayRect.offsetX + displayRect.dispW
          );
          const top = Math.min(
            Math.max(topYpx, displayRect.offsetY),
            displayRect.offsetY + displayRect.dispH
          );
          return (
            <button
              key={`${obj.word}-${i}`}
              type="button"
              onClick={() => tapPill(i)}
              style={{ left: `${left}px`, top: `${top}px` }}
              className="absolute -translate-x-1/2 -translate-y-full pb-1 flex flex-col items-center"
            >
              <AnimatePresence>
                {revealed === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.9 }}
                    className="mb-1 px-2 py-1 rounded-xl bg-dark/90 text-white font-body text-xs whitespace-nowrap"
                  >
                    {obj.thai}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.span
                whileTap={{ scale: 0.92 }}
                animate={{ opacity: isKept ? 1 : 0.5 }}
                className={`flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full font-heading font-bold text-xs whitespace-nowrap shadow-card border-2 ${
                  isKept
                    ? "bg-primary text-white border-white"
                    : "bg-white/90 text-gray-500 border-gray-200"
                }`}
              >
                {isKept && <Check className="w-3 h-3" strokeWidth={3} />}
                {obj.word}
                {isKept && (
                  <span
                    role="button"
                    aria-label={`Drop ${obj.word}`}
                    onClick={(e) => dropPill(i, e)}
                    className="ml-0.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                )}
              </motion.span>
            </button>
          );
        })}
      </div>

      <div className="p-5 flex flex-col gap-3">
        <p className="font-heading font-extrabold text-base text-dark text-center">
          Koko found {objects.length} things — tap a pill to hear it, tap the × to drop it
        </p>
        <button
          type="button"
          onClick={() => onConfirm(kept)}
          disabled={kept.length === 0}
          className="btn-aqua w-full py-3 justify-center disabled:opacity-40"
        >
          <Check className="w-4 h-4" /> Keep {kept.length} word{kept.length === 1 ? "" : "s"}
        </button>
      </div>
    </motion.div>
  );
}
