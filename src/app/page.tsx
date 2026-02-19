"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Sparkles } from "@/components/ui/sparkles";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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

export default function DashboardPage() {
  const [conditions, setConditions] = useState<BreakCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchConditions() {
      try {
        const res = await fetch("/api/conditions");
        if (res.ok) {
          const data = await res.json();
          setConditions(data.conditions ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch conditions:", err);
      }
      setLoading(false);
    }
    fetchConditions();
  }, []);

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
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
              SurfsUp
            </span>
          </h1>
          <p className="text-zinc-400 text-sm">
            All breaks ranked by current conditions
          </p>
          {lastUpdated && (
            <p className="text-xs text-zinc-600 mt-1">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {/* Search */}
        {conditions.length > 0 && (
          <div className="relative mb-6">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, region, or type..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-800 focus:ring-1 focus:ring-cyan-800/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {conditions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🏖️</div>
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">No conditions yet</h2>
            <p className="text-zinc-500">Conditions will appear once data is fetched.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const q = search.toLowerCase().trim();
              const filtered = q
                ? conditions.filter((c) =>
                    c.breakName.toLowerCase().includes(q) ||
                    c.region.toLowerCase().includes(q) ||
                    c.breakType.toLowerCase().includes(q)
                  )
                : conditions;

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12">
                    <p className="text-zinc-500 text-sm">No breaks matching &ldquo;{search}&rdquo;</p>
                  </div>
                );
              }

              return filtered.map((cond, i) => {
              const isEpic = cond.qualityLabel === "Epic";
              return (
                <motion.div
                  key={cond.breakId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/break/${cond.breakId}`} className="block group">
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

                      {/* Hover chevron */}
                      <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </CardSpotlight>
                  </Link>
                </motion.div>
              );
            });
            })()}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-zinc-600">
            Powered by Open-Meteo, NOAA Buoy Network &amp; NOAA Tides. Conditions are forecasts and may differ from actual surf.
          </p>
        </footer>
      </div>
    </div>
  );
}
