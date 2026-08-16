"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, BookOpen, Sparkles, CalendarCheck2, Mic } from "lucide-react";

interface Summary {
  kidName: string | null;
  cefrLevel: string | null;
  streak: number;
  coins: number;
  completedNodes: number;
  wordsCollectedTotal: number;
  wordsCollectedThisWeek: number;
  wordsMasteredTotal: number;
  wordsMasteredThisWeek: number;
  dailyLoopStepsThisWeek: number;
  dailyLoopDoneToday: boolean;
  spokenSentencesThisWeek: number;
}

const EMPTY: Summary = {
  kidName: null, cefrLevel: null, streak: 0, coins: 0, completedNodes: 0,
  wordsCollectedTotal: 0, wordsCollectedThisWeek: 0, wordsMasteredTotal: 0,
  wordsMasteredThisWeek: 0, dailyLoopStepsThisWeek: 0, dailyLoopDoneToday: false,
  spokenSentencesThisWeek: 0,
};

function StatCard({
  icon: Icon, label, value, sub,
}: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProgressReport() {
  const [summary, setSummary] = useState<Summary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/parent/summary")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Summary) => setSummary({ ...EMPTY, ...data }))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          {summary.kidName ? `${summary.kidName}'s progress` : "Progress"}
        </h2>
        {summary.cefrLevel && (
          <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
            {summary.cefrLevel}
          </span>
        )}
      </div>

      {failed && (
        <p className="text-xs text-gray-400">Couldn't load live numbers right now — showing zeros.</p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0.5 : 1 }}
        className="grid grid-cols-2 gap-3"
      >
        <StatCard icon={Flame} label="Day streak" value={summary.streak} />
        <StatCard
          icon={CalendarCheck2}
          label="Today's loop"
          value={summary.dailyLoopDoneToday ? "Done" : "Not yet"}
        />
        <StatCard
          icon={BookOpen}
          label="Words collected"
          value={summary.wordsCollectedTotal}
          sub={`+${summary.wordsCollectedThisWeek} this week`}
        />
        <StatCard
          icon={Sparkles}
          label="Words mastered"
          value={summary.wordsMasteredTotal}
          sub={`+${summary.wordsMasteredThisWeek} this week`}
        />
        <StatCard
          icon={CalendarCheck2}
          label="Learning steps"
          value={summary.dailyLoopStepsThisWeek}
          sub="this week"
        />
        <StatCard
          icon={Mic}
          label="Spoken sentences"
          value={summary.spokenSentencesThisWeek}
          sub="this week"
        />
      </motion.div>
    </div>
  );
}
