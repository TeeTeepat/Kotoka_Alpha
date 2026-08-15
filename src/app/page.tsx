"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SandboxWorld from "@/components/world/SandboxWorld";

/**
 * Home = the Living Sandbox. The world view replaces the old path/dashboard:
 * collectibles live in a small world tinted by time of day and weather,
 * with a quiet, unannounced way into today's loop. No counters, no banners.
 */
export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await fetch("/api/auth/init", { method: "POST" });
        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const user = await userRes.json();
          if (!user.isOnboarded || !user.targetLanguage || !user.learningLanguage) {
            router.push("/onboarding/language");
            return;
          }
        }
      } catch {
        // ignore — the world still renders
      } finally {
        if (!cancelled) {
          setReady(true);
          window.dispatchEvent(new Event("kotoka-app-ready"));
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className={ready ? "" : "opacity-0"} style={{ transition: "opacity 0.6s" }}>
      <SandboxWorld />
    </div>
  );
}
