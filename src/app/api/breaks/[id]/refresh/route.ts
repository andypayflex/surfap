import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { breaks, conditions, forecasts } from "@/lib/db/schema";
import { fetchMarineForecast } from "@/lib/sources/open-meteo";
import { fetchTideConditions, fetchTideForecastDays } from "@/lib/sources/noaa-tides";
import { fetchBuoyData } from "@/lib/sources/noaa-buoy";
import { calculateScore, getQualityLabel } from "@/lib/scoring";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [brk] = await db.select().from(breaks).where(eq(breaks.id, id)).limit(1);
  if (!brk) {
    return NextResponse.json({ error: "Break not found" }, { status: 404 });
  }

  try {
    const forecastDays = await fetchMarineForecast(brk.latitude, brk.longitude, 7);
    if (!forecastDays || forecastDays.length === 0) {
      return NextResponse.json({ error: "No marine forecast data available" }, { status: 502 });
    }

    const buoy = brk.nearestBuoyStation
      ? await fetchBuoyData(brk.nearestBuoyStation)
      : null;

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 6);
    const tideForecast = brk.nearestTideStation
      ? await fetchTideForecastDays(brk.nearestTideStation, today, endDate)
      : null;

    const todayTide = brk.nearestTideStation
      ? await fetchTideConditions(brk.nearestTideStation)
      : null;

    const now = new Date().toISOString();
    const todayDate = forecastDays[0].date;
    const day0 = forecastDays[0];

    const waveHeightFt = buoy && buoy.waveHeightFt > 0 ? buoy.waveHeightFt : day0.waveHeightFt;
    const swellPeriodS = buoy && buoy.dominantPeriodS > 0 ? buoy.dominantPeriodS : day0.swellPeriodS;
    const windSpeedMph = buoy && buoy.windSpeedMph > 0 ? buoy.windSpeedMph : day0.windSpeedMph;
    const windDirectionDeg = buoy && buoy.windDirectionDeg > 0 ? buoy.windDirectionDeg : day0.windDirectionDeg;
    const swellHeightFt = buoy && buoy.waveHeightFt > 0 ? buoy.waveHeightFt : day0.swellHeightFt;
    const faceHeightFt = swellHeightFt * (brk.exposureFactor ?? 0.7);

    const conditionsInput = {
      waveHeightFt: faceHeightFt,
      swellPeriodS,
      swellDirectionDeg: day0.swellDirectionDeg,
      windSpeedMph,
      windDirectionDeg,
      tideHeightFt: todayTide?.tideHeightFt ?? null,
    };

    const score = calculateScore(brk, conditionsInput);
    const label = getQualityLabel(score);

    await db.delete(conditions).where(eq(conditions.breakId, brk.id));
    await db.insert(conditions).values({
      id: nanoid(),
      breakId: brk.id,
      fetchedAt: now,
      waveHeightFt,
      swellHeightFt,
      faceHeightFt,
      swellPeriodS: conditionsInput.swellPeriodS,
      swellDirectionDeg: conditionsInput.swellDirectionDeg,
      windSpeedMph: conditionsInput.windSpeedMph,
      windDirectionDeg: conditionsInput.windDirectionDeg,
      tideHeightFt: conditionsInput.tideHeightFt,
      tideState: todayTide?.tideState ?? null,
      qualityScore: score,
      qualityLabel: label,
    });

    await db.delete(forecasts).where(eq(forecasts.breakId, brk.id));

    const forecastRows = forecastDays
      .filter((day) => day.date !== todayDate)
      .map((day) => {
        const daySwellHeight = day.swellHeightFt;
        const dayFaceHeight = daySwellHeight * (brk.exposureFactor ?? 0.7);
        const dayTide = tideForecast?.get(day.date) ?? null;

        const dayConditions = {
          waveHeightFt: dayFaceHeight,
          swellPeriodS: day.swellPeriodS,
          swellDirectionDeg: day.swellDirectionDeg,
          windSpeedMph: day.windSpeedMph,
          windDirectionDeg: day.windDirectionDeg,
          tideHeightFt: dayTide?.tideHeightFt ?? null,
        };

        const dayScore = calculateScore(brk, dayConditions);
        const dayLabel = getQualityLabel(dayScore);

        return {
          id: nanoid(),
          breakId: brk.id,
          forecastDate: day.date,
          fetchedAt: now,
          waveHeightFt: day.waveHeightFt,
          swellHeightFt: daySwellHeight,
          faceHeightFt: dayFaceHeight,
          swellPeriodS: day.swellPeriodS,
          swellDirectionDeg: day.swellDirectionDeg,
          windSpeedMph: day.windSpeedMph,
          windDirectionDeg: day.windDirectionDeg,
          tideHeightFt: dayTide?.tideHeightFt ?? null,
          tideState: dayTide?.tideState ?? null,
          qualityScore: dayScore,
          qualityLabel: dayLabel,
        };
      });

    if (forecastRows.length > 0) {
      await db.insert(forecasts).values(forecastRows);
    }

    return NextResponse.json({ success: true, fetchedAt: now });
  } catch (err) {
    console.error(`Error refreshing conditions for ${brk.name}:`, err);
    return NextResponse.json({ error: "Failed to refresh conditions" }, { status: 500 });
  }
}
