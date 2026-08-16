"use client";

import Silhouette from "@/components/world/Silhouette";
import type { CropBox } from "./types";

interface CropThumbProps {
  photoUrl: string | null;
  cropBox: CropBox | null;
  word: string;
  bodyPlan: string | null;
  sensorySize: string | null;
  texture: string | null | undefined;
  className?: string;
}

/**
 * A word's photo cropped to its object, purely with CSS — no canvas.
 * The image is scaled so the normalized crop box fills the container
 * exactly, then offset so that box's top-left lands at the container's
 * origin. Falls back to the full photo (existing decks have no cropBox
 * yet), then to the word's silhouette when there's no photo at all.
 */
export default function CropThumb({
  photoUrl,
  cropBox,
  word,
  bodyPlan,
  sensorySize,
  texture,
  className,
}: CropThumbProps) {
  if (!photoUrl) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <Silhouette bodyPlan={bodyPlan} size={sensorySize} texture={texture} />
      </div>
    );
  }

  if (!cropBox) {
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={word} className="w-full h-full object-cover" />
      </div>
    );
  }

  const { x, y, w, h } = cropBox;

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt={word}
        className="absolute max-w-none max-h-none"
        style={{
          width: `${100 / w}%`,
          height: `${100 / h}%`,
          left: `${-(x / w) * 100}%`,
          top: `${-(y / h) * 100}%`,
        }}
      />
    </div>
  );
}
