"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { SOUND_LIBRARY } from "@/lib/ambientSounds";

interface AmbientPlayerProps {
  soundId: string;
  autoPlay?: boolean;
}

export function AmbientPlayer({ soundId, autoPlay = false }: AmbientPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const sound = SOUND_LIBRARY[soundId] ?? SOUND_LIBRARY["S01"];

  useEffect(() => {
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    if (autoPlay) {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-card-border shadow-card"
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
      >
        <AnimatePresence mode="wait">
          {playing ? (
            <motion.span key="on" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
              <Volume2 className="w-4 h-4 text-primary" />
            </motion.span>
          ) : (
            <motion.span key="off" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
              <VolumeX className="w-4 h-4 text-gray-400" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-xs text-dark truncate">
          {sound.emoji} {sound.name}
        </p>
        <p className="font-body text-[10px] text-gray-400">Ambient sound</p>
      </div>

      {playing && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          className="flex items-center gap-2"
        >
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 accent-primary cursor-pointer"
          />
        </motion.div>
      )}

      {playing && (
        <div className="flex items-end gap-0.5 h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-primary rounded-full"
              animate={{ height: ["4px", "14px", "6px", "10px", "4px"] }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
