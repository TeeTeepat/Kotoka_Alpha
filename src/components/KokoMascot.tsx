"use client";

import { motion, type Variants } from "framer-motion";

export type KokoState =
  | "idle"
  | "greeting"
  | "thinking"
  | "celebrating"
  | "encouraging"
  | "excited";

const GIF_MAP: Record<KokoState, string> = {
  idle:        "/koko-idle",
  greeting:    "/koko-waving",
  thinking:    "/koko-thinking",
  celebrating: "/koko-celebrate",
  encouraging: "/koko-encourage",
  excited:     "/koko-excited",
};

interface KokoMascotProps {
  state: KokoState;
  /** Tailwind size classes for the container (default: w-28 h-28) */
  className?: string;
  /** Set true for above-the-fold instances to skip lazy loading */
  priority?: boolean;
  /** Pass mascotVariants for pages that use Framer Motion state transitions */
  variants?: Variants;
  /** Framer Motion animate target (e.g. "celebrating", "encouraging") */
  animate?: string;
}

export default function KokoMascot({
  state,
  className = "w-28 h-28",
  priority = false,
  variants,
  animate,
}: KokoMascotProps) {
  const base = GIF_MAP[state];

  const img = (
    // WebP source omitted until scripts/optimize-koko-gifs.sh has been run
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${base}.gif`}
      alt={`Koko ${state}`}
      loading={priority ? "eager" : "lazy"}
      className="object-contain w-full h-full"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/koko-sit-removebg.png";
      }}
    />
  );

  if (variants && animate) {
    return (
      <motion.div variants={variants} animate={animate} className={className}>
        {img}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {img}
    </motion.div>
  );
}
