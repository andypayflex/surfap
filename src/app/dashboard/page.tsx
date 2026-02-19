"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Sparkles } from "@/components/ui/sparkles";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";

interface BreakCondition {
  breakId: string;
  breakName: string;
  region: string;
  breakType: string;
  qualityScore: number;
  qualityLabel: string;
  waveHeightFt: number;
  swellHeightFt: number;
  faceHeightFt: number;
  swellPeriodS: number;
  swellDirectionDeg: number;
  windSpeedMph: number;
  windDirectionDeg: number;
  tideHeightFt: number | null;
  tideState: string | null;
  fetchedAt: string;
}

function degreesToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function getLabelColor(label: string): string {
  switch (label) {
    case "Epic": return "text-blue-400";
    case "Very Good": return "text-green-400";
    case "Good": return "text-yellow-400";
    case "Fair": return "text-orange-400";
    case "Poor": return "text-red-400";
    default: return "text-zinc-400";
  }
}

function getLabelBg(label: string): string {
  switch (label) {
    case "Epic": return "bg-blue-500/10 border-blue-500/30 text-blue-400";
    case "Very Good": return "bg-green-500/10 border-green-500/30 text-green-400";
    case "Good": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
    case "Fair": return "bg-orange-500/10 border-orange-500/30 text-orange-400";
    case "Poor": return "bg-red-500/10 border-red-500/30 text-red-400";
    default: return "bg-zinc-500/10 border-zinc-500/30 text-zinc-400";
  }
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const strokeColor =
    label === "Epic" ? "#3b82f6" :
    label === "Very Good" ? "#22c55e" :
    label === "Good" ? "#eab308" :
    label === "Fair" ? "#f97316" :
    "#ef4444";

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#27272a" strokeWidth="4" />
        <motion.circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className={`text-sm font-bold ${getLabelColor(label)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const params = useSearchParams();
  const userId = params.get("user");

  const [conditions, setConditions] = useState<BreakCondition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConditions = useCallback(async () => {
    if (!userId) return;

    const res = await fetch(`/api/dashboard?user=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setConditions(data.conditions ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-200 mb-3">No User ID</h1>
          <p className="text-zinc-400 mb-6">Access your dashboard from the link in your email.</p>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🌊</div>
          <p className="text-zinc-500">Loading conditions...</p>
        </div>
      </div>
    );
  }

  const lastUpdated = conditions[0]?.fetchedAt
    ? new Date(conditions[0].fetchedAt).toLocaleString()
    : "N/A";

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-block">
            ← SurfsUp
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Your{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
              surf conditions
            </span>
          </h1>
          <p className="text-sm text-zinc-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        {conditions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🏖️</div>
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">No breaks selected</h2>
            <p className="text-zinc-500 mb-6">Pick some surf breaks to see conditions here.</p>
            <Link
              href={`/breaks?user=${userId}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg"
            >
              Choose Breaks
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conditions.map((cond, i) => {
              const isEpic = cond.qualityLabel === "Epic";
              return (
                <motion.div
                  key={cond.breakId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <CardSpotlight
                    className={`relative ${isEpic ? "border-blue-500/30" : ""}`}
                    color={isEpic ? "rgba(59, 130, 246, 0.12)" : "rgba(14, 116, 144, 0.1)"}
                  >
                    {isEpic && <Sparkles count={12} color="#3b82f6" size={3} />}

                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 text-center">
                        <span className="text-2xl font-bold text-zinc-600">
                          {i + 1}
                        </span>
                      </div>

                      {/* Score ring */}
                      <ScoreRing score={cond.qualityScore} label={cond.qualityLabel} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-zinc-100 truncate">
                            {cond.breakName}
                          </h3>
                          <Badge
                            className={`text-xs border ${getLabelBg(cond.qualityLabel)}`}
                          >
                            {cond.qualityLabel}
                          </Badge>
                        </div>

                        {/* Conditions grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-1 mt-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Swell</span>
                            <span className="text-sm font-medium text-zinc-300">
                              {cond.swellHeightFt.toFixed(1)} ft
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-cyan-700 block">Face</span>
                            <span className="text-sm font-bold text-cyan-300">
                              {cond.faceHeightFt.toFixed(1)} ft
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Period</span>
                            <span className="text-sm font-medium text-zinc-300">
                              {cond.swellPeriodS.toFixed(0)}s {degreesToCompass(cond.swellDirectionDeg)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Wind</span>
                            <span className="text-sm font-medium text-zinc-300">
                              {cond.windSpeedMph.toFixed(0)} mph {degreesToCompass(cond.windDirectionDeg)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Tide</span>
                            <span className="text-sm font-medium text-zinc-300">
                              {cond.tideHeightFt !== null ? `${cond.tideHeightFt.toFixed(1)} ft` : "—"}
                              {cond.tideState ? ` (${cond.tideState})` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardSpotlight>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer links */}
        <div className="mt-10 text-center space-x-6">
          <Link
            href={`/breaks?user=${userId}`}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition"
          >
            Edit Breaks
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-400 transition"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🌊</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
