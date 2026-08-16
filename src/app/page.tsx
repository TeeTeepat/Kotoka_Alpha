"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import DailyProgressRing from "@/components/dashboard/DailyProgressRing";
import RecentWordsStrip from "@/components/dashboard/RecentWordsStrip";
import MemoryMapWidget from "@/components/dashboard/MemoryMapWidget";
import ForgettingCurveWidget from "@/components/dashboard/ForgettingCurveWidget";
import { useLocale } from "@/lib/i18n";
import type { DeckWithWords, WordData } from "@/types";

interface DashboardUser {
  name: string | null;
  checkpointDoneAt: string | null;
  peakBPendingAt: string | null;
}

interface MemoryPin {
  id: string;
  locationName: string;
  colorPalette: string;
  locationLat: number;
  locationLng: number;
  words: { id: string; word: string }[];
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Best-effort step count for today's /daily loop — see DailyProgressRing.
 * checkpointDoneAt is only ever set once the loop's full 8-step run
 * (snap+confirm, 4 flex steps, pronunciation, second take) has completed,
 * so its presence today is itself the "all done" signal; peakBPendingAt
 * only tracks whether the overnight settle ceremony has played, not
 * whether the steps themselves are finished.
 */
function stepsFromUser(user: DashboardUser | null): number {
  if (!user) return 0;
  return isToday(user.checkpointDoneAt) ? 8 : 0;
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [decks, setDecks] = useState<DeckWithWords[]>([]);
  const [pins, setPins] = useState<MemoryPin[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      await fetch("/api/auth/init", { method: "POST" });
      const userRes = await fetch("/api/user");
      if (userRes.ok) {
        const u = await userRes.json();
        if (!u.isOnboarded || !u.targetLanguage || !u.learningLanguage) {
          router.push("/onboarding/language");
          return;
        }
        setUser({ name: u.name ?? null, checkpointDoneAt: u.checkpointDoneAt ?? null, peakBPendingAt: u.peakBPendingAt ?? null });
      }
    } catch {
      setError(t.dashErrorTitle);
    } finally {
      setReady(true);
      window.dispatchEvent(new Event("kotoka-app-ready"));
    }

    // Best-effort, independent of the boot check above — a failure here
    // never blocks the page from rendering.
    setLoadingDecks(true);
    Promise.all([
      fetch("/api/decks").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/memory-map").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([deckData, pinData]) => {
        setDecks(Array.isArray(deckData) ? deckData : []);
        setPins(Array.isArray(pinData) ? pinData : []);
      })
      .finally(() => setLoadingDecks(false));
  }, [router, t.dashErrorTitle]);

  useEffect(() => {
    load();
  }, [load]);

  const recentWords: WordData[] = [...decks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .flatMap((d) => d.words);

  return (
    <div className={ready ? "" : "opacity-0"} style={{ transition: "opacity 0.6s" }}>
      <div className="py-4 space-y-4">
        {error && (
          <div className="card-base p-4 border-red-200 bg-red-50/50 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-body text-sm text-red-600 flex-1">{error}</p>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-red-200 font-heading font-bold text-xs text-red-600"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t.dashErrorRetry}
            </button>
          </div>
        )}

        <DailyProgressRing stepsDone={stepsFromUser(user)} greetingName={user?.name} />
        <RecentWordsStrip words={recentWords} />
        <ForgettingCurveWidget decks={decks} loading={loadingDecks} targetHref="/study" />
        <MemoryMapWidget pins={pins} />
      </div>
    </div>
  );
}
