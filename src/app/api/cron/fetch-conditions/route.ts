import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks, conditions, forecasts } from '@/lib/db/schema';
import { fetchMarineForecast } from '@/lib/sources/open-meteo';
import { fetchTideConditions, fetchTideForecastDays } from '@/lib/sources/noaa-tides';
import { fetchBuoyData } from '@/lib/sources/noaa-buoy';
import { calculateScore, getQualityLabel } from '@/lib/scoring';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleFetchConditions(req);
}

export async function POST(req: NextRequest) {
  return handleFetchConditions(req);
}

async function handleFetchConditions(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const allBreaks = await db.select().from(breaks);

  console.log(`Fetching conditions for ${allBreaks.length} breaks...`);

  let successCount = 0;
  let forecastCount = 0;
  let errorCount = 0;

  // Process breaks in batches of 5 to avoid hammering APIs
  const BATCH_SIZE = 5;
  for (let i = 0; i < allBreaks.length; i += BATCH_SIZE) {
    const batch = allBreaks.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (brk) => {
        try {
          // Fetch 7-day marine forecast (replaces single-day fetch)
          const forecastDays = await fetchMarineForecast(brk.latitude, brk.longitude, 7);
          if (!forecastDays || forecastDays.length === 0) {
            console.error(`No marine forecast data for ${brk.name}`);
            errorCount++;
            return;
          }

          // Fetch buoy data for today only (real-time only)
          const buoy = brk.nearestBuoyStation
            ? await fetchBuoyData(brk.nearestBuoyStation)
            : null;

          // Fetch tide forecast for the full range
          const today = new Date();
          const endDate = new Date();
          endDate.setDate(today.getDate() + 6);
          const tideForecast = brk.nearestTideStation
            ? await fetchTideForecastDays(brk.nearestTideStation, today, endDate)
            : null;

          // Also fetch current tide for today's conditions
          const todayTide = brk.nearestTideStation
            ? await fetchTideConditions(brk.nearestTideStation)
            : null;

          const now = new Date().toISOString();
          const todayDate = forecastDays[0].date;

          // --- Day 0: Update current conditions (same logic as before) ---
          const day0 = forecastDays[0];

          // Use buoy to supplement today's data
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

          successCount++;

          // --- Days 1-6: Store forecasts ---
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
            forecastCount += forecastRows.length;
          }
        } catch (err) {
          console.error(`Error processing ${brk.name}:`, err);
          errorCount++;
        }
      }),
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`Fetch conditions complete: ${successCount} success, ${forecastCount} forecasts, ${errorCount} errors in ${elapsed}s`);

  return NextResponse.json({
    success: true,
    processed: successCount,
    forecasts: forecastCount,
    errors: errorCount,
    elapsedSeconds: parseFloat(elapsed),
  });
}
