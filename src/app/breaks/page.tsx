"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

interface Break {
  id: string;
  name: string;
  region: string;
  breakType: string;
  qualityScore: number | null;
  qualityLabel: string | null;
}

function BreakSelectionContent() {
  const params = useSearchParams();
  const userId = params.get("user");

  const [allBreaks, setAllBreaks] = useState<Break[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [breaksRes, userBreaksRes] = await Promise.all([
      fetch("/api/breaks"),
      userId ? fetch(`/api/user/breaks?user=${userId}`) : Promise.resolve(null),
    ]);

    const breaksData = await breaksRes.json();
    setAllBreaks(breaksData.breaks ?? []);

    if (userBreaksRes) {
      const userData = await userBreaksRes.json();
      setSelectedIds(new Set(userData.breakIds ?? []));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleBreak(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 15) {
        next.add(id);
      }
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);

    const res = await fetch(`/api/user/breaks?user=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ breakIds: Array.from(selectedIds) }),
    });

    if (res.ok) {
      setSaved(true);
    }
    setSaving(false);
  }

  // Group breaks by region
  const regions = allBreaks.reduce<Record<string, Break[]>>((acc, brk) => {
    if (!acc[brk.region]) acc[brk.region] = [];
    acc[brk.region].push(brk);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Loading breaks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Choose your{" "}
            <span className="text-cyan-400">surf breaks</span>
          </h1>
          <p className="text-zinc-400">
            Select up to 15 breaks. We&apos;ll rank them daily and send you the top 5.
          </p>
          <p className="text-sm text-zinc-600 mt-2">
            {selectedIds.size}/15 selected
          </p>
        </div>

        {/* Break cards by region */}
        {Object.entries(regions).map(([region, regionBreaks]) => (
          <div key={region} className="mb-10">
            <h2 className="text-lg font-semibold text-zinc-300 mb-4 border-b border-zinc-800 pb-2">
              {region}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionBreaks.map((brk, i) => {
                const isSelected = selectedIds.has(brk.id);
                return (
                  <motion.div
                    key={brk.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <CardSpotlight
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "border-cyan-500/60 bg-cyan-950/20"
                          : "hover:border-zinc-700"
                      }`}
                      color={isSelected ? "rgba(6, 182, 212, 0.15)" : "rgba(14, 116, 144, 0.1)"}
                      onClick={() => toggleBreak(brk.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-zinc-100">{brk.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs border-zinc-700 text-zinc-400"
                            >
                              {brk.breakType}
                            </Badge>
                            {brk.qualityLabel && (
                              <span className={`text-xs font-medium ${
                                brk.qualityLabel === "Epic" ? "text-blue-400" :
                                brk.qualityLabel === "Very Good" ? "text-green-400" :
                                brk.qualityLabel === "Good" ? "text-yellow-400" :
                                brk.qualityLabel === "Fair" ? "text-orange-400" :
                                "text-red-400"
                              }`}>
                                {brk.qualityLabel} {brk.qualityScore !== null && `(${brk.qualityScore})`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                            isSelected
                              ? "border-cyan-400 bg-cyan-400"
                              : "border-zinc-600"
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </CardSpotlight>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Save bar */}
        <div className="sticky bottom-6 flex justify-center mt-8">
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl px-6 py-4 flex items-center gap-4 shadow-2xl">
            <span className="text-sm text-zinc-400">
              {selectedIds.size} break{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              onClick={handleSave}
              disabled={saving || selectedIds.size === 0}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold border-0 cursor-pointer"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save Selection"}
            </Button>
            {saved && userId && (
              <Link
                href={`/dashboard?user=${userId}`}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition"
              >
                View Dashboard →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BreaksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    }>
      <BreakSelectionContent />
    </Suspense>
  );
}
