// Surf quality scoring algorithm
// Max score: 100 (wave height 20 + swell period 30 + wind 25 + swell direction 15 + tide 10)

export interface BreakInfo {
  orientationDeg: number;
  optimalSwellDirMin: number;
  optimalSwellDirMax: number;
  optimalTideLow: number;
  optimalTideHigh: number;
}

export interface ConditionsInput {
  waveHeightFt: number;
  swellPeriodS: number;
  swellDirectionDeg: number;
  windSpeedMph: number;
  windDirectionDeg: number;
  tideHeightFt: number | null;
}

/**
 * Calculate the absolute angular difference between two compass bearings.
 * Returns 0-180 degrees.
 */
function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Check if a direction is within a directional range (handles wrap-around at 360).
 */
function isInRange(dir: number, min: number, max: number): boolean {
  dir = ((dir % 360) + 360) % 360;
  min = ((min % 360) + 360) % 360;
  max = ((max % 360) + 360) % 360;

  if (min <= max) {
    return dir >= min && dir <= max;
  }
  // Wraps around 0/360
  return dir >= min || dir <= max;
}

/**
 * Check if direction is within 30 degrees of the optimal range edges.
 */
function isWithin30Degrees(dir: number, min: number, max: number): boolean {
  return angleDiff(dir, min) <= 30 || angleDiff(dir, max) <= 30;
}

export function calculateScore(breakInfo: BreakInfo, conditions: ConditionsInput): number {
  let score = 0;

  // Wave height (max 20 pts) — bell curve around 3-5ft
  const wh = conditions.waveHeightFt;
  if (wh >= 3 && wh <= 5) score += 20;
  else if (wh >= 2 && wh < 3) score += 15;
  else if (wh > 5 && wh <= 8) score += 15;
  else if (wh >= 1 && wh < 2) score += 10;
  else if (wh > 8) score += 5;
  // < 1ft = 0

  // Swell period (max 30 pts)
  const sp = conditions.swellPeriodS;
  if (sp >= 13) score += 30;
  else if (sp >= 10) score += 25;
  else if (sp >= 8) score += 15;
  else if (sp >= 6) score += 5;
  // < 6s = 0

  // Wind direction relative to break orientation (max 25 pts)
  const windAngle = angleDiff(conditions.windDirectionDeg, breakInfo.orientationDeg);
  if (windAngle >= 150) score += 25;           // offshore
  else if (conditions.windSpeedMph < 5) score += 20; // calm
  else if (windAngle >= 120) score += 10;      // cross-offshore
  // onshore = 0

  // Swell direction match (max 15 pts)
  if (isInRange(conditions.swellDirectionDeg, breakInfo.optimalSwellDirMin, breakInfo.optimalSwellDirMax)) {
    score += 15;
  } else if (isWithin30Degrees(conditions.swellDirectionDeg, breakInfo.optimalSwellDirMin, breakInfo.optimalSwellDirMax)) {
    score += 10;
  }

  // Tide (max 10 pts)
  if (conditions.tideHeightFt !== null) {
    if (conditions.tideHeightFt >= breakInfo.optimalTideLow &&
        conditions.tideHeightFt <= breakInfo.optimalTideHigh) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

export function getQualityLabel(score: number): string {
  if (score >= 81) return 'Epic';
  if (score >= 61) return 'Very Good';
  if (score >= 41) return 'Good';
  if (score >= 21) return 'Fair';
  return 'Poor';
}
