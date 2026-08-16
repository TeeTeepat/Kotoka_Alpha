"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Volume2, VolumeX } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import { atmosphereTint } from "./atmosphereTint";
import { useAtmosphereSound } from "./useAtmosphereSound";

export interface AtmosphericWord {
  id: string;
  word: string;
  translation: string;
  example: string;
  phonetic: string;
  photoUrl: string | null;
  ambientSoundUrl: string | null;
  deck: {
    atmosphere: string;
    ambientSound: string;
    colorPalette: string;
    imageBase64: string | null;
    createdAt: string;
    weatherAtSnap: string | null;
  };
}

interface AtmosphericFlashcardProps {
  word: AtmosphericWord;
  onAnswer: (gotIt: boolean) => void;
}

/**
 * The Study tab's star feature: a flashcard whose background recreates the
 * scene it was snapped in — the original photo, that scene's ambient
 * sound, and a weather/time tint matching conditions at snap time — so the
 * kid re-encounters the word in the environment it was learned in
 * ("atmospheric memory anchoring"). Flip mechanics are adapted from
 * FlashcardsSkill (not imported — that component is owned by the review
 * flow); no score or coins are ever shown here.
 */
export default function AtmosphericFlashcard({ word, onAnswer }: AtmosphericFlashcardProps) {
  const { t } = useLocale();
  const { play } = useSoundPlayer();
  const [flipped, setFlipped] = useState(false);
  const sound = useAtmosphereSound(word.ambientSoundUrl ?? word.deck.ambientSound);

  useEffect(() => {
    setFlipped(false);
    sound.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  const tint = atmosphereTint({
    snapAt: new Date(word.deck.createdAt),
    weatherAtSnap: word.deck.weatherAtSnap,
    colorPalette: word.deck.colorPalette,
  });

  const sceneImage = word.photoUrl
    ? word.photoUrl
    : word.deck.imageBase64
      ? `data:image/jpeg;base64,${word.deck.imageBase64}`
      : null;

  const handleFlip = () => {
    play("click");
    const next = !flipped;
    setFlipped(next);
    if (next) sound.start();
    else sound.stop();
  };

  const handleAnswer = (gotIt: boolean) => {
    play(gotIt ? "correct" : "pop");
    sound.stop();
    onAnswer(gotIt);
  };

  return (
    <div className="space-y-4">
      <div className="perspective-1000 w-full" style={{ height: 300 }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-full cursor-pointer"
          onClick={handleFlip}
        >
          {/* Front — the atmospheric scene */}
          <div
            style={{ backfaceVisibility: "hidden", background: tint.background }}
            className="absolute inset-0 rounded-card border-[1.5px] border-card-border shadow-card overflow-hidden"
          >
            {sceneImage && (
              <Image
                src={sceneImage}
                alt=""
                fill
                className="object-cover opacity-70"
                unoptimized={sceneImage.startsWith("data:")}
              />
            )}
            {tint.weatherWash && (
              <div className="absolute inset-0" style={{ background: tint.weatherWash }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

            {sound.available && (
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center">
                {sound.playing ? (
                  <Volume2 className="w-4 h-4 text-white" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/70" />
                )}
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-center gap-1 text-center">
              <h2 className="font-heading font-extrabold text-3xl text-white drop-shadow">{word.word}</h2>
              <p className="font-body text-sm text-white/80">{word.phonetic}</p>
              <p className="font-body text-[11px] text-white/60 mt-2">{t.studyTapToReveal}</p>
            </div>
          </div>

          {/* Back */}
          <div
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className="absolute inset-0 rounded-card border-[1.5px] shadow-card bg-white flex flex-col justify-between p-5"
          >
            <div>
              <p className="font-body text-xs text-gray-400 mb-1">{t.studyTranslation}</p>
              <p className="font-heading font-extrabold text-xl text-dark">{word.translation}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-body text-xs text-dark leading-relaxed">{word.example}</p>
            </div>
            <p className="font-body text-[10px] text-gray-300 text-center">{t.studyTapToFlipBack}</p>
          </div>
        </motion.div>
      </div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAnswer(false)}
            className="py-3 rounded-2xl border-[1.5px] border-orange-200 bg-orange-50 text-orange-500 font-heading font-extrabold text-sm"
          >
            {t.studyStillLearning}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAnswer(true)}
            className="py-3 rounded-2xl border-[1.5px] border-emerald-200 bg-emerald-50 text-emerald-600 font-heading font-extrabold text-sm"
          >
            {t.studyGotIt}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
