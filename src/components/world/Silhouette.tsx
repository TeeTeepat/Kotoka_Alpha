"use client";

import { useId } from "react";
import {
  BODY_PLAN_FILLS,
  BODY_PLAN_PATHS,
  SIZE_PX,
  TEXTURE_PATTERNS,
  asBodyPlan,
  asSensorySize,
  asTexture,
} from "@/lib/compositing";

interface SilhouetteProps {
  bodyPlan?: string | null;
  size?: string | null;
  /** First sensory texture drives the L1 overlay. */
  texture?: string | null;
  className?: string;
}

/**
 * L0 silhouette + L1 texture overlay for one collectible.
 * Pure inline SVG — no external assets.
 */
export default function Silhouette({
  bodyPlan,
  size,
  texture,
  className,
}: SilhouetteProps) {
  const uid = useId().replace(/[:]/g, "");
  const plan = asBodyPlan(bodyPlan);
  const px = SIZE_PX[asSensorySize(size)];
  const tex = asTexture(texture);
  const spec = tex ? TEXTURE_PATTERNS[tex] : null;
  const patternId = `tex-${uid}`;
  const clipId = `clip-${uid}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY_PLAN_PATHS[plan]} />
        </clipPath>
        {spec && (
          <pattern
            id={patternId}
            width={spec.size}
            height={spec.size}
            patternUnits="userSpaceOnUse"
            dangerouslySetInnerHTML={{ __html: spec.markup }}
          />
        )}
      </defs>
      {/* L0: body plan silhouette */}
      <path d={BODY_PLAN_PATHS[plan]} fill={BODY_PLAN_FILLS[plan]} />
      {/* L1: texture overlay clipped to the silhouette */}
      {spec && (
        <rect
          width="100"
          height="100"
          fill={`url(#${patternId})`}
          opacity={spec.opacity}
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  );
}
