"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { StudyNode } from "@/types";
import { generatePathPoints, generateSVGPath, calculatePathHeight } from "@/lib/path/geometry";
import PathNode from "./PathNode";

interface WindingPathProps {
  nodes: StudyNode[];
  activeNodeId?: string;
  onNodeClick: (nodeId: string) => void;
}

function getNodeState(node: StudyNode, activeNodeId?: string): "locked" | "available" | "active" | "completed" | "checkpoint" {
  if (node.isCompleted) return "completed";
  if (node.id === activeNodeId) return node.isCheckpoint ? "checkpoint" : "active";
  if (!node.isLocked) return node.isCheckpoint ? "checkpoint" : "available";
  return "locked";
}

export default function WindingPath({ nodes, activeNodeId, onNodeClick }: WindingPathProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const points = generatePathPoints(nodes.length, containerWidth);
  const svgPath = generateSVGPath(points);
  const totalHeight = calculatePathHeight(nodes.length);

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: totalHeight }}>
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: totalHeight }}
        viewBox={`0 0 ${containerWidth} ${totalHeight}`}
      >
        <path d={svgPath} fill="none" stroke="#e5e7eb" strokeWidth="4" strokeLinecap="round" />
        <motion.path
          d={svgPath}
          fill="none"
          stroke="#1ad3e2"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={totalHeight * 2}
          strokeDashoffset={totalHeight * 2}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          opacity={0.6}
        />
      </svg>

      <div className="relative" style={{ height: totalHeight }}>
        {points.map((point, i) => {
          const node = nodes[i];
          if (!node) return null;
          const state = getNodeState(node, activeNodeId);
          return (
            <div
              key={node.id}
              className="absolute"
              style={{ left: point.x - 28, top: point.y - 28, willChange: "transform" }}
            >
              <PathNode node={node} state={state} onClick={onNodeClick} index={i} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
