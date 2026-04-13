"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImageIcon, Scan, X, RotateCcw, Loader2 } from "lucide-react";
import Image from "next/image";
import KokoMascot from "@/components/KokoMascot";
import { useRouter } from "next/navigation";
import WordPickDeck from "@/components/vocab/WordPickDeck";
import type { SnapResponse, VocabWord } from "@/types";
import { useLocale } from "@/lib/i18n";

export default function SnapPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // liveStream state triggers the useEffect that attaches srcObject
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SnapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useLocale();

  // Attach stream to video element whenever either changes
  useEffect(() => {
    if (liveStream && videoRef.current) {
      videoRef.current.srcObject = liveStream;
    }
  }, [liveStream]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setLiveStream(null);
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraReady(false);
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setLiveStream(stream); // triggers the useEffect above
    } catch {
      setCameraError(true);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !cameraReady) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImagePreview(dataUrl);
    setImageBase64(dataUrl.split(",")[1]);
    stopCamera();
  }, [cameraReady, stopCamera]);

  const handleGalleryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  const handleReset = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    startCamera();
  }, [startCamera]);

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to analyze image");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }, [imageBase64]);

  // Auto-analyze as soon as an image is captured or uploaded
  useEffect(() => {
    if (imageBase64 && !result && !analyzing) {
      handleAnalyze();
    }
  // handleAnalyze is stable (useCallback with imageBase64 dep); result/analyzing prevent re-fire
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBase64]);

  // FIX 6: compress full image to <50KB thumbnail before storing
  const compressToThumbnail = useCallback((base64Full: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = () => {
        const maxW = 400;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
      };
      img.onerror = () => resolve(""); // fallback: no thumbnail
      img.src = `data:image/jpeg;base64,${base64Full}`;
    });
  }, []);

  const handleDeckCreate = useCallback(async (kept: VocabWord[]) => {
    if (!result) return;
    const narrowed: SnapResponse = { scene: result.scene, vocabulary: kept };
    if (imageBase64) {
      const thumbnail = await compressToThumbnail(imageBase64);
      if (thumbnail) sessionStorage.setItem("kotoka-snap-thumbnail", thumbnail);
    }
    sessionStorage.setItem("kotoka-snap-result", JSON.stringify(narrowed));
    router.push("/tag");
  }, [result, imageBase64, compressToThumbnail, router]);

  const showCamera = !imagePreview && !cameraError;

  return (
    <>
      {/* ── Full-screen camera: sits between StatusBar (z-50,h-14) and BottomNav (z-50,h-20) */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed top-14 bottom-20 left-0 right-0 z-40 bg-black flex flex-col"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setCameraReady(true)}
              className="flex-1 w-full object-cover"
            />

            {/* Loading overlay */}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="font-body text-sm text-gray-400">Opening camera…</p>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 inset-x-0 pb-6 pt-6 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between px-10">
              <motion.label
                htmlFor="gallery-input"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-2xl border-2 border-white/40 bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-pointer"
              >
                <ImageIcon className="w-5 h-5 text-white" />
              </motion.label>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center disabled:opacity-40 shadow-2xl"
              >
                <div className="w-14 h-14 rounded-full bg-white" />
              </motion.button>

              <div className="w-12 h-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden gallery input */}
      <input
        ref={galleryInputRef}
        id="gallery-input"
        type="file"
        accept="image/*"
        onChange={handleGalleryChange}
        className="hidden"
      />

      {/* ── Page content (always rendered, visible when no camera) ── */}
      <div className="py-4 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading font-extrabold text-xl text-dark mb-1">{t.snapTitle}</h1>
          <p className="font-body text-sm text-gray-500">
            {t.snapSubtitle}
          </p>
        </motion.div>

        {/* Camera error fallback */}
        {!imagePreview && cameraError && (
          <div className="card-base p-6 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Camera className="w-9 h-9 text-gray-400" />
            </div>
            <p className="font-body text-sm text-gray-500 text-center">
              {t.snapCameraError}
            </p>
            <motion.label htmlFor="gallery-input" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-aqua cursor-pointer w-full py-3">
              <ImageIcon className="w-4 h-4" /> {t.snapGallery}
            </motion.label>
          </div>
        )}

        {/* Preview after capture / upload */}
        <AnimatePresence mode="wait">
          {imagePreview && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="card-base overflow-hidden"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image src={imagePreview} alt="Captured scene" fill className="object-cover" />
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={handleReset}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                  <X className="w-4 h-4" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={handleReset}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
                  title="Retake">
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>

              {!result && analyzing && (
                <div className="p-4 flex flex-col items-center gap-2">
                  <KokoMascot state="thinking" className="w-20 h-20" />
                  <div className="flex items-center gap-2 text-primary font-body text-sm font-semibold">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Scan className="w-4 h-4" />
                    </motion.div>
                    Analyzing Scene…
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="card-base p-4 border-red-200 bg-red-50/50">
              <p className="font-body text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results — card-swipe pick-5 */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <KokoMascot state="excited" className="w-8 h-8" />
                <h2 className="font-heading font-extrabold text-lg text-dark">{t.snapPickWords}</h2>
                <span className="text-xs font-body font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {result.vocabulary.length} {t.snapFound}
                </span>
              </div>
              <p className="font-body text-xs text-gray-400">{t.snapScene}: {result.scene}</p>

              <WordPickDeck words={result.vocabulary} onComplete={handleDeckCreate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
