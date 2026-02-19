import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userBreaks, breaks, conditions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/send';
import DailyDigest, { type BreakCondition } from '@/lib/email/templates/daily-digest';
import * as React from 'react';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for Vercel

const MAX_EMAILS_PER_RUN = 100; // Resend free tier: 100/day
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  // Get all verified users
  const verifiedUsers = await db
    .select()
    .from(users)
    .where(eq(users.emailVerified, true))
    .limit(MAX_EMAILS_PER_RUN);

  console.log(`Sending emails to ${verifiedUsers.length} verified users...`);

  let sent = 0;
  let failed = 0;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  for (const user of verifiedUsers) {
    try {
      // Get user's selected breaks with latest conditions
      const userBreakConditions = await db
        .select({
          breakName: breaks.name,
          qualityScore: conditions.qualityScore,
          qualityLabel: conditions.qualityLabel,
          waveHeightFt: conditions.waveHeightFt,
          swellPeriodS: conditions.swellPeriodS,
          swellDirectionDeg: conditions.swellDirectionDeg,
          windSpeedMph: conditions.windSpeedMph,
          windDirectionDeg: conditions.windDirectionDeg,
          tideHeightFt: conditions.tideHeightFt,
          tideState: conditions.tideState,
        })
        .from(userBreaks)
        .innerJoin(breaks, eq(userBreaks.breakId, breaks.id))
        .innerJoin(conditions, eq(breaks.id, conditions.breakId))
        .where(eq(userBreaks.userId, user.id))
        .orderBy(desc(conditions.qualityScore))
        .limit(5);

      if (userBreakConditions.length === 0) {
        console.log(`No break conditions for user ${user.email}, skipping`);
        continue;
      }

      const breakData: BreakCondition[] = userBreakConditions.map((row, idx) => ({
        rank: idx + 1,
        name: row.breakName,
        qualityScore: row.qualityScore ?? 0,
        qualityLabel: row.qualityLabel ?? 'Poor',
        waveHeightFt: row.waveHeightFt ?? 0,
        swellPeriodS: row.swellPeriodS ?? 0,
        swellDirectionDeg: row.swellDirectionDeg ?? 0,
        windSpeedMph: row.windSpeedMph ?? 0,
        windDirectionDeg: row.windDirectionDeg ?? 0,
        tideHeightFt: row.tideHeightFt ?? null,
        tideState: row.tideState ?? null,
      }));

      const topLabel = breakData[0].qualityLabel;
      const unsubscribeUrl = `${BASE_URL}/api/user/unsubscribe?token=${user.unsubscribeToken}`;
      const dashboardUrl = `${BASE_URL}/dashboard?user=${user.id}`;

      const result = await sendEmail({
        to: user.email,
        subject: `🏄 ${topLabel} surf today — ${breakData[0].name} (${breakData[0].qualityScore}/100)`,
        react: React.createElement(DailyDigest, {
          breaks: breakData,
          unsubscribeUrl,
          dashboardUrl,
          date: today,
        }),
      });

      if (result.success) {
        sent++;
        console.log(`Email sent to ${user.email}`);
      } else {
        failed++;
        console.error(`Email failed for ${user.email}: ${result.error}`);
      }
    } catch (err) {
      failed++;
      console.error(`Error processing email for ${user.email}:`, err);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`Email job complete: ${sent} sent, ${failed} failed in ${elapsed}s`);

  return NextResponse.json({
    success: true,
    sent,
    failed,
    totalUsers: verifiedUsers.length,
    elapsedSeconds: parseFloat(elapsed),
  });
}
