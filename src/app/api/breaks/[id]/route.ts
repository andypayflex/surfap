import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { breaks, conditions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const results = await db
      .select({
        breakId: breaks.id,
        breakName: breaks.name,
        region: breaks.region,
        breakType: breaks.breakType,
        latitude: breaks.latitude,
        longitude: breaks.longitude,
        orientationDeg: breaks.orientationDeg,
        optimalSwellDirMin: breaks.optimalSwellDirMin,
        optimalSwellDirMax: breaks.optimalSwellDirMax,
        optimalWindDir: breaks.optimalWindDir,
        optimalTideLow: breaks.optimalTideLow,
        optimalTideHigh: breaks.optimalTideHigh,
        webcamUrl: breaks.webcamUrl,
        qualityScore: conditions.qualityScore,
        qualityLabel: conditions.qualityLabel,
        waveHeightFt: conditions.waveHeightFt,
        swellHeightFt: conditions.swellHeightFt,
        faceHeightFt: conditions.faceHeightFt,
        swellPeriodS: conditions.swellPeriodS,
        swellDirectionDeg: conditions.swellDirectionDeg,
        windSpeedMph: conditions.windSpeedMph,
        windDirectionDeg: conditions.windDirectionDeg,
        tideHeightFt: conditions.tideHeightFt,
        tideState: conditions.tideState,
        fetchedAt: conditions.fetchedAt,
      })
      .from(breaks)
      .leftJoin(conditions, eq(breaks.id, conditions.breakId))
      .where(eq(breaks.id, id))
      .orderBy(desc(conditions.fetchedAt))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 });
    }

    const r = results[0];
    return NextResponse.json({
      breakId: r.breakId,
      breakName: r.breakName,
      region: r.region,
      breakType: r.breakType,
      latitude: r.latitude,
      longitude: r.longitude,
      orientationDeg: r.orientationDeg,
      optimalSwellDirMin: r.optimalSwellDirMin,
      optimalSwellDirMax: r.optimalSwellDirMax,
      optimalWindDir: r.optimalWindDir,
      optimalTideLow: r.optimalTideLow,
      optimalTideHigh: r.optimalTideHigh,
      qualityScore: r.qualityScore ?? 0,
      qualityLabel: r.qualityLabel ?? "Poor",
      waveHeightFt: r.waveHeightFt ?? 0,
      swellHeightFt: r.swellHeightFt ?? 0,
      faceHeightFt: r.faceHeightFt ?? 0,
      swellPeriodS: r.swellPeriodS ?? 0,
      swellDirectionDeg: r.swellDirectionDeg ?? 0,
      windSpeedMph: r.windSpeedMph ?? 0,
      windDirectionDeg: r.windDirectionDeg ?? 0,
      tideHeightFt: r.tideHeightFt,
      tideState: r.tideState,
      fetchedAt: r.fetchedAt ?? "",
      webcamUrl: r.webcamUrl,
    });
  } catch (err) {
    console.error("Break detail fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
