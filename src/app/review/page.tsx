"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, MapPin, BookOpen, MessageCircle } from "lucide-react";
import type { StudyNode } from "@/types";
import { useSoundPlayer } from "@/components/hooks/useSoundPlayer";
import WindingPath from "@/components/path/WindingPath";
import EmptyPathState from "@/components/path/EmptyPathState";
import { loadSessionFromStorage } from "@/lib/session/clientStateManager";
import { useLocale } from "@/lib/i18n";

export default function ReviewPage() {
  const router = useRouter();
  const { play } = useSoundPlayer();
  const { t } = useLocale();
  const [nodes, setNodes] = useState<StudyNode[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastStudiedAt, setLastStudiedAt] = useState<string | null>(null);
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Check for existing session
        const savedSession = loadSessionFromStorage();
        if (savedSession) setShowResume(true);

        // Fetch path
        const pathRes = await fetch("/api/study/path");
        if (pathRes.ok) {
          const data = await pathRes.json();
          setNodes(data.nodes || []);
          setTotalDue(data.totalDue || 0);
        }

        // Fetch stats
        const statsRes = await fetch("/api/user/stats");
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setLastStudiedAt(stats.lastStudiedAt);
        }
      } catch (err) {
        console.error("[ReviewPage] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleNodeClick = (nodeId: string) => {
    play("click");
    router.push(`/review/session/${nodeId}`);
  };

  const handleResume = () => {
    play("click");
    const saved = loadSessionFromStorage();
    if (saved) {
      router.push(`/review/session/${saved.nodeId}`);
    }
  };

  // Find first non-locked, non-completed node as active
  const activeNodeId = nodes.find(n => !n.isLocked && !n.isCompleted)?.id;

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-extrabold text-xl text-dark">{t.reviewTitle}</h1>
        <p className="font-body text-sm text-gray-500">
          {totalDue > 0 ? `${totalDue} ${t.reviewWordsReady}` : t.reviewAllCaughtUp}
        </p>
      </motion.div>

      {/* Resume session banner */}
      {showResume && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-4 bg-gradient-to-r from-primary/10 to-cyan-50 border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-extrabold text-sm text-dark">Resume your session?</p>
              <p className="font-body text-xs text-gray-400">You have an unfinished session</p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { play("click"); setShowResume(false); }}
                className="px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-gray-500 bg-gray-100"
              >
                Dismiss
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleResume}
                className="btn-aqua px-4 py-1.5 text-xs"
              >
                Resume
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick access cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/review/conversation", icon: MessageCircle, label: t.reviewConversation, desc: t.conversationInstruction, color: "bg-blue-50 text-blue-600" },
          { href: "/story", icon: BookOpen, label: t.storyTitle, desc: t.storySubtitle, color: "bg-purple-50 text-purple-600" },
          { href: "/community/leaderboard", icon: Trophy, label: t.leaderboardTitle, desc: t.leaderboardSubtitle, color: "bg-amber-50 text-amber-600" },
          { href: "/community/nearby", icon: MapPin, label: t.nearbyTitle, desc: t.nearbySubtitle, color: "bg-emerald-50 text-emerald-600" },
        ].map((item, i) => (
          <motion.button
            key={item.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(item.href)}
            className="card-base p-3.5 text-left flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color.split(" ")[0]}`}>
              <item.icon className={`w-5 h-5 ${item.color.split(" ")[1]}`} />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm text-dark truncate">{item.label}</p>
              <p className="font-body text-xs text-gray-400 truncate">{item.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" style={{ marginLeft: `${(i % 3 - 1) * 40}px` }} />
            </div>
          ))}
        </div>
      ) : nodes.length === 0 ? (
        <EmptyPathState lastStudiedAt={lastStudiedAt} />
      ) : (
        <WindingPath
          nodes={nodes}
          activeNodeId={activeNodeId}
          onNodeClick={handleNodeClick}
        />
      )}
    </div>
  );
}
