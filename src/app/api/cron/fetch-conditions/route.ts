import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks, conditions } from '@/lib/db/schema';
import { fetchMarineConditions } from '@/lib/sources/open-meteo';
import { fetchTideConditions } from '@/lib/sources/noaa-tides';
import { fetchBuoyData } from '@/lib/sources/noaa-buoy';
import { calculateScore, getQualityLabel } from '@/lib/scoring';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const allBreaks = await db.select().from(breaks);

  console.log(`Fetching conditions for ${allBreaks.length} breaks...`);

  let successCount = 0;
  let errorCount = 0;

  // Process breaks in batches of 5 to avoid hammering APIs
  const BATCH_SIZE = 5;
  for (let i = 0; i < allBreaks.length; i += BATCH_SIZE) {
    const batch = allBreaks.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (brk) => {
        try {
          // Fetch marine conditions (required)
          const marine = await fetchMarineConditions(brk.latitude, brk.longitude);
          if (!marine) {
            console.error(`No marine data for ${brk.name}`);
            errorCount++;
            return;
          }

          // Fetch tide conditions (best effort)
          const tide = brk.nearestTideStation
            ? await fetchTideConditions(brk.nearestTideStation)
            : null;

          // Fetch buoy data (optional enrichment)
          const buoy = brk.nearestBuoyStation
            ? await fetchBuoyData(brk.nearestBuoyStation)
            : null;

          // Use buoy data to supplement/override forecast when available
          const waveHeightFt = buoy && buoy.waveHeightFt > 0
            ? buoy.waveHeightFt
            : marine.waveHeightFt;
          const swellPeriodS = buoy && buoy.dominantPeriodS > 0
            ? buoy.dominantPeriodS
            : marine.swellPeriodS;
          const windSpeedMph = buoy && buoy.windSpeedMph > 0
            ? buoy.windSpeedMph
            : marine.windSpeedMph;
          const windDirectionDeg = buoy && buoy.windDirectionDeg > 0
            ? buoy.windDirectionDeg
            : marine.windDirectionDeg;

          // Swell height from Open-Meteo (or buoy if available)
          const swellHeightFt = buoy && buoy.waveHeightFt > 0
            ? buoy.waveHeightFt
            : marine.swellHeightFt;

          // Face height = swell height * exposure factor for this break
          const faceHeightFt = swellHeightFt * (brk.exposureFactor ?? 0.7);

          const conditionsInput = {
            waveHeightFt: faceHeightFt, // scoring uses estimated face height
            swellPeriodS,
            swellDirectionDeg: marine.swellDirectionDeg,
            windSpeedMph,
            windDirectionDeg,
            tideHeightFt: tide?.tideHeightFt ?? null,
          };

          const score = calculateScore(brk, conditionsInput);
          const label = getQualityLabel(score);
          const now = new Date().toISOString();

          // Delete existing condition for this break, then insert new one
          await db.delete(conditions).where(eq(conditions.breakId, brk.id));
          await db.insert(conditions).values({
            id: nanoid(),
            breakId: brk.id,
            fetchedAt: now,
            waveHeightFt: waveHeightFt,
            swellHeightFt: swellHeightFt,
            faceHeightFt: faceHeightFt,
            swellPeriodS: conditionsInput.swellPeriodS,
            swellDirectionDeg: conditionsInput.swellDirectionDeg,
            windSpeedMph: conditionsInput.windSpeedMph,
            windDirectionDeg: conditionsInput.windDirectionDeg,
            tideHeightFt: conditionsInput.tideHeightFt,
            tideState: tide?.tideState ?? null,
            qualityScore: score,
            qualityLabel: label,
          });

          successCount++;
        } catch (err) {
          console.error(`Error processing ${brk.name}:`, err);
          errorCount++;
        }
      }),
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`Fetch conditions complete: ${successCount} success, ${errorCount} errors in ${elapsed}s`);

  return NextResponse.json({
    success: true,
    processed: successCount,
    errors: errorCount,
    elapsedSeconds: parseFloat(elapsed),
  });
}
