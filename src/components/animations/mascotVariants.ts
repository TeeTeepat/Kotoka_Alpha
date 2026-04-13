import type { Variants } from "framer-motion";

/**
 * Reusable Framer Motion variant library for the Koko mascot.
 *
 * Usage:
 *   <motion.img src="/koko-sit-removebg.png" variants={mascotVariants} animate="celebrating" />
 *   <motion.div variants={mascotVariants} animate="idle"><Image ... /></motion.div>
 */

export const mascotVariants = {
  idle: {
    y: [0, -4, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  celebrating: {
    scale: [1, 1.15],
    y: [-8, 0],
    transition: { duration: 0.8, type: "spring", stiffness: 300, damping: 20 },
  },
  encouraging: {
    rotate: [-5, 5, -5],
    transition: { duration: 0.4, repeat: 2, ease: "easeInOut" },
  },
  thinking: {
    rotate: -15,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
  excited: {
    y: [-20, 0, -10, 0],
    scale: [1, 1.15, 1.1, 1],
    transition: { type: "tween", duration: 0.6, times: [0, 0.5, 0.75, 1] },
  },
} satisfies Variants;

export type MascotState = keyof typeof mascotVariants;
