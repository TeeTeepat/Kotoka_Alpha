"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Silhouette from "./Silhouette";
import { ShimmerGlow } from "./ShimmerOverlay";
import { SIZE_PX, asSensorySize, collectibleTreatment } from "@/lib/compositing";
import type { WorldCollectible } from "./types";

interface CollectibleSpriteProps {
  collectible: WorldCollectible;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMoved: (id: string, posX: number, posY: number) => void;
  /** Topic shimmer earned — renders a subtle glow overlay, nothing more. */
  shimmer?: boolean;
}

const DRAG_THRESHOLD_PX = 6;

/**
 * One collectible in the world. Drag to rearrange (pointer events),
 * tap a bloomed one to peek at its photo + word.
 */
export default function CollectibleSprite({
  collectible,
  containerRef,
  onMoved,
  shimmer = false,
}: CollectibleSpriteProps) {
  const [pos, setPos] = useState({ x: collectible.posX, y: collectible.posY });
  const [dragging, setDragging] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const start = useRef<{ px: number; py: number; moved: boolean } | null>(null);

  const treatment = collectibleTreatment(collectible.dim, collectible.createdAt);

  const toPercent = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.min(96, Math.max(2, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(94, Math.max(4, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;
    if (!start.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    start.current.moved = true;
    setDragging(true);
    const p = toPercent(e.clientX, e.clientY);
    if (p) setPos(p);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasDrag = start.current?.moved;
    start.current = null;
    setDragging(false);
    if (wasDrag) {
      const p = toPercent(e.clientX, e.clientY);
      if (p) {
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        setPos({ x, y });
        onMoved(collectible.id, x, y);
      }
    } else if (!collectible.dim) {
      setShowCard((s) => !s);
    }
  };

  return (
    <div
      className="absolute touch-none select-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -85%)",
        zIndex: dragging ? 30 : showCard ? 25 : 10,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
        setDragging(false);
      }}
    >
      <motion.div
        animate={
          dragging
            ? { scale: 1.12, y: -4 }
            : { scale: 1, y: [0, -2, 0] }
        }
        transition={
          dragging
            ? { duration: 0.15 }
            : { duration: 4 + (collectible.id.charCodeAt(0) % 3), repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          opacity: treatment.opacity,
          filter: treatment.filter,
          position: "relative",
        }}
      >
        {shimmer && (
          <ShimmerGlow size={SIZE_PX[asSensorySize(collectible.sensorySize)]} />
        )}
        <Silhouette
          bodyPlan={collectible.bodyPlan}
          size={collectible.sensorySize}
          texture={collectible.sensoryTextures?.[0]}
        />
      </motion.div>

      <AnimatePresence>
        {showCard && !collectible.dim && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 rounded-2xl bg-white/95 shadow-lg border border-white/60 overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {(collectible.settledPhotoUrl || collectible.photoUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={collectible.settledPhotoUrl || collectible.photoUrl || ""}
                alt={collectible.word}
                className="w-full h-20 object-cover"
              />
            )}
            <div className="p-2">
              <p className="font-heading font-extrabold text-xs text-dark truncate">
                {collectible.word}
              </p>
              {collectible.translation && (
                <p className="font-body text-[10px] text-gray-400 truncate">
                  {collectible.translation}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
