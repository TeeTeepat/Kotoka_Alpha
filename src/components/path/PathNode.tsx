"use client";

import { motion } from "framer-motion";
import type { StudyNode } from "@/types";
import { LockIcon, CheckIcon, TrophyIcon, StarIcon, PlayIcon } from "./NodeIcon";

type NodeState = "locked" | "available" | "active" | "completed" | "checkpoint";

interface PathNodeProps {
  node: StudyNode;
  state: NodeState;
  onClick: (nodeId: string) => void;
  index: number;
}

const STATE_CONFIG: Record<NodeState, { bg: string; border: string; iconColor: string; clickable: boolean }> = {
  locked: { bg: "bg-gray-100", border: "border-2 border-dashed border-gray-300", iconColor: "text-gray-400", clickable: false },
  available: { bg: "bg-gradient-to-br from-cyan-50 to-teal-50", border: "border-2 border-primary/30", iconColor: "text-primary", clickable: true },
  active: { bg: "bg-gradient-to-br from-cyan-100 to-teal-100", border: "border-[3px] border-primary shadow-lg shadow-primary/20", iconColor: "text-primary", clickable: true },
  completed: { bg: "bg-emerald-50", border: "border-2 border-emerald-200", iconColor: "text-emerald-500", clickable: false },
  checkpoint: { bg: "bg-gradient-to-br from-amber-100 to-yellow-100", border: "border-2 border-amber-300", iconColor: "text-amber-600", clickable: true },
};

function StateIcon({ state }: { state: NodeState }) {
  const size = 20;
  switch (state) {
    case "locked": return <LockIcon size={size} />;
    case "completed": return <CheckIcon size={size} />;
    case "checkpoint": return <TrophyIcon size={size} />;
    default: return <PlayIcon size={size} />;
  }
}

export default function PathNode({ node, state, onClick, index }: PathNodeProps) {
  const config = STATE_CONFIG[state];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      className="relative"
    >
      {(state === "active" || state === "available") && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: state === "active" ? "rgba(26,211,226,0.2)" : "rgba(26,211,226,0.1)" }}
          animate={{ scale: [1, state === "active" ? 1.3 : 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: state === "active" ? 2 : 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <motion.button
        onClick={() => config.clickable && onClick(node.id)}
        disabled={!config.clickable}
        whileHover={config.clickable ? { scale: 1.08 } : {}}
        whileTap={config.clickable ? { scale: 0.95 } : {}}
        className={`relative w-14 h-14 rounded-full ${config.bg} ${config.border} flex items-center justify-center transition-colors ${
          config.clickable ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span className={config.iconColor}><StateIcon state={state} /></span>
        {state === "checkpoint" && (
          <div className="absolute -top-2 flex gap-0.5">
            <span className="text-amber-400"><StarIcon size={12} /></span>
            <span className="text-amber-400"><StarIcon size={12} /></span>
            <span className="text-amber-400"><StarIcon size={12} /></span>
          </div>
        )}
      </motion.button>

      {(state === "available" || state === "active") && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[9px] font-heading font-bold text-gray-400">~{node.targetDurationMin}m</span>
        </div>
      )}
    </motion.div>
  );
}
