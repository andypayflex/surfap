"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Sparkles } from "@/components/ui/sparkles";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface BreakDetail {
  breakId: string;
  breakName: string;
  region: string;
  breakType: string;
  latitude: number;
  longitude: number;
  orientationDeg: number;
  optimalSwellDirMin: number;
  optimalSwellDirMax: number;
  optimalWindDir: string;
  optimalTideLow: number;
  optimalTideHigh: number;
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

interface Photo {
  url: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
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

function ScoreRing({ score, label, size = "md" }: { score: number; label: string; size?: "md" | "lg" }) {
  const radius = size === "lg" ? 40 : 28;
  const dim = size === "lg" ? 96 : 64;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const strokeColor =
    label === "Epic" ? "#3b82f6" :
    label === "Very Good" ? "#22c55e" :
    label === "Good" ? "#eab308" :
    label === "Fair" ? "#f97316" :
    "#ef4444";

  return (
    <div className="relative flex-shrink-0" style={{ width: dim, height: dim }}>
      <svg className="-rotate-90" style={{ width: dim, height: dim }} viewBox={`0 0 ${dim} ${dim}`}>
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="#27272a" strokeWidth="4" />
        <motion.circle
          cx={dim / 2} cy={dim / 2} r={radius}
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
          className={`${size === "lg" ? "text-xl" : "text-sm"} font-bold ${getLabelColor(label)}`}
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

export default function BreakDetailPage() {
  const params = useParams<{ id: string }>();
  const [breakData, setBreakData] = useState<BreakDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    async function fetchData() {
      try {
        const [breakRes, photosRes] = await Promise.all([
          fetch(`/api/breaks/${params.id}`),
          fetch(`/api/breaks/${params.id}/photos`),
        ]);

        if (breakRes.ok) {
          setBreakData(await breakRes.json());
        }
        if (photosRes.ok) {
          const data = await photosRes.json();
          setPhotos(data.photos ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch break detail:", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🌊</div>
          <p className="text-zinc-500">Loading break details...</p>
        </div>
      </div>
    );
  }

  if (!breakData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">Break not found</h2>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm">
            &larr; Back to all breaks
          </Link>
        </div>
      </div>
    );
  }

  const isEpic = breakData.qualityLabel === "Epic";

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-cyan-400 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          All breaks
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
              {breakData.breakName}
            </h1>
            <Badge className={`text-sm border ${getLabelBg(breakData.qualityLabel)}`}>
              {breakData.qualityLabel}
            </Badge>
          </div>
          <p className="text-zinc-500">
            {breakData.region} &middot; {breakData.breakType.charAt(0).toUpperCase() + breakData.breakType.slice(1)} break
          </p>
        </motion.div>

        {/* Photo hero */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className={`grid gap-2 ${photos.length === 1 ? "grid-cols-1" : photos.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-lg ${i === 0 && photos.length === 3 ? "col-span-2" : ""}`}
                >
                  <img
                    src={photo.smallUrl}
                    alt={`${breakData.breakName} surf`}
                    className="w-full h-48 object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <a
                    href={photo.unsplashUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-[10px] text-zinc-400 hover:text-white transition-colors"
                  >
                    Photo by{" "}
                    <span className="underline">{photo.photographer}</span>
                    {" "}on Unsplash
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Current conditions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <CardSpotlight
            className={isEpic ? "border-blue-500/30" : ""}
            color={isEpic ? "rgba(59, 130, 246, 0.12)" : "rgba(14, 116, 144, 0.1)"}
          >
            {isEpic && <Sparkles count={12} color="#3b82f6" size={3} />}

            <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">Current Conditions</h2>

            <div className="flex items-start gap-5">
              <ScoreRing score={breakData.qualityScore} label={breakData.qualityLabel} size="lg" />

              <div className="flex-1">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Swell</span>
                    <span className="text-sm font-medium text-zinc-300">
                      {breakData.swellHeightFt.toFixed(1)} ft
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-cyan-700 block">Face</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {breakData.faceHeightFt.toFixed(1)} ft
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Period</span>
                    <span className="text-sm font-medium text-zinc-300">
                      {breakData.swellPeriodS.toFixed(0)}s {degreesToCompass(breakData.swellDirectionDeg)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Wind</span>
                    <span className="text-sm font-medium text-zinc-300">
                      {breakData.windSpeedMph.toFixed(0)} mph {degreesToCompass(breakData.windDirectionDeg)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Tide</span>
                    <span className="text-sm font-medium text-zinc-300">
                      {breakData.tideHeightFt !== null ? `${breakData.tideHeightFt.toFixed(1)} ft` : "—"}
                      {breakData.tideState ? ` (${breakData.tideState})` : ""}
                    </span>
                  </div>
                </div>

                {breakData.fetchedAt && (
                  <p className="text-[10px] text-zinc-600 mt-3">
                    Updated: {new Date(breakData.fetchedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardSpotlight>
        </motion.div>

        {/* Break info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CardSpotlight color="rgba(14, 116, 144, 0.06)">
            <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">Break Details</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Type</span>
                <span className="text-sm font-medium text-zinc-300 capitalize">{breakData.breakType}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Region</span>
                <span className="text-sm font-medium text-zinc-300">{breakData.region}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Orientation</span>
                <span className="text-sm font-medium text-zinc-300">{degreesToCompass(breakData.orientationDeg)} ({breakData.orientationDeg}°)</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Optimal Swell</span>
                <span className="text-sm font-medium text-zinc-300">
                  {degreesToCompass(breakData.optimalSwellDirMin)}–{degreesToCompass(breakData.optimalSwellDirMax)} ({breakData.optimalSwellDirMin}°–{breakData.optimalSwellDirMax}°)
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Optimal Wind</span>
                <span className="text-sm font-medium text-zinc-300">{breakData.optimalWindDir}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 block">Optimal Tide</span>
                <span className="text-sm font-medium text-zinc-300">
                  {breakData.optimalTideLow.toFixed(1)}–{breakData.optimalTideHigh.toFixed(1)} ft
                </span>
              </div>
            </div>
          </CardSpotlight>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <CardSpotlight color="rgba(14, 116, 144, 0.06)">
            <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">Location</h2>
            <div className="rounded-lg overflow-hidden">
              <iframe
                className="w-full h-64 sm:h-80 border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${breakData.longitude - 0.02},${breakData.latitude - 0.015},${breakData.longitude + 0.02},${breakData.latitude + 0.015}&layer=mapnik&marker=${breakData.latitude},${breakData.longitude}`}
                loading="lazy"
              />
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${breakData.latitude}&mlon=${breakData.longitude}#map=15/${breakData.latitude}/${breakData.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-cyan-400 transition-colors mt-2"
            >
              View larger map
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-4.5h6m0 0v6m0-6L9.75 14.25" />
              </svg>
            </a>
          </CardSpotlight>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-zinc-600">
            Powered by Open-Meteo, NOAA Buoy Network &amp; NOAA Tides. Photos from Unsplash.
          </p>
        </footer>
      </div>
    </div>
  );
}
