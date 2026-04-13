"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ParticleType = "confetti" | "sparkles" | "streak" | "coin";

interface ParticleEffectProps {
  type: ParticleType;
  trigger: boolean;
  position?: "center" | "top" | "bottom";
  onComplete?: () => void;
}

const COLORS = {
  confetti: ["#1ad3e2", "#f9d0cc", "#ded6ec", "#f5c842", "#ff8c42", "#10b981"],
  sparkles: ["#f5c842", "#fbbf24", "#fde68a"],
  streak: ["#ff8c42", "#f97316", "#ea580c"],
  coin: ["#f5c842", "#fbbf24"],
};

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
}

export function ParticleEffect({
  type,
  trigger,
  position = "center",
  onComplete,
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const MAX_PARTICLES = typeof window !== "undefined" && window.innerWidth < 400 ? 12 : 30;
  const DURATION = typeof window !== "undefined" && window.innerWidth < 400 ? 1500 : 3000;

  const createParticles = useCallback(() => {
    const particles: Particle[] = [];
    const colors = COLORS[type];
    const count = type === "sparkles" ? 8 : MAX_PARTICLES;

    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        x: 0,
        y: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: type === "sparkles" ? 3 + Math.random() * 4 : 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * (type === "confetti" ? 8 : 4),
        velocityY: type === "confetti"
          ? -(Math.random() * 6 + 2)
          : type === "streak"
            ? -(Math.random() * 3 + 1)
            : (Math.random() - 0.5) * 3,
      });
    }
    return particles;
  }, [type, MAX_PARTICLES]);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    particlesRef.current = createParticles();
    startTimeRef.current = Date.now();

    const cx = rect.width / 2;
    const cy = position === "top" ? rect.height * 0.2 : position === "bottom" ? rect.height * 0.8 : rect.height / 2;

    function animate() {
      if (!ctx) return;
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > DURATION) {
        ctx.clearRect(0, 0, rect.width, rect.height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);
      const progress = elapsed / DURATION;

      particlesRef.current.forEach((p) => {
        const px = cx + p.velocityX * elapsed * 0.05;
        const gravity = type === "confetti" ? 0.003 : 0.001;
        const py = cy + p.velocityY * elapsed * 0.05 + gravity * elapsed * 0.05;
        const alpha = 1 - progress;
        const rotation = p.rotation + elapsed * 0.1;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (type === "sparkles") {
          // Star shape
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            const angle = (j * Math.PI) / 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * p.size, Math.sin(angle) * p.size);
          }
          ctx.fill();
        } else if (type === "coin") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.1)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else {
          // Rectangular confetti / streak
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }

        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [trigger, type, position, DURATION, createParticles, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ zIndex: 50 }}
    />
  );
}
