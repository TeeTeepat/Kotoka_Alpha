"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import PinGate from "@/components/parent/PinGate";
import ProgressReport from "@/components/parent/ProgressReport";
import LineConnectCard from "@/components/parent/LineConnectCard";

export default function ParentPage() {
  const router = useRouter();

  return (
    <PinGate>
      <div className="min-h-screen bg-slate-50 pb-10">
        <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-gray-800">Parent</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-5 space-y-6">
          <ProgressReport />
          <LineConnectCard />
        </main>
      </div>
    </PinGate>
  );
}
