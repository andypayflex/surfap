// NOAA CO-OPS Tides & Currents API client
// Docs: https://api.tidesandcurrents.noaa.gov/api/prod/

export interface TideConditions {
  tideHeightFt: number;
  tideState: 'rising' | 'falling' | 'high' | 'low';
}

interface TidePrediction {
  t: string; // "2026-02-19 05:30"
  v: string; // "3.456" (feet)
}

interface NOAATideResponse {
  predictions: TidePrediction[];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Fetch today's tide predictions for a NOAA station.
 * Determines current tide height and whether tide is rising or falling.
 */
export async function fetchTideConditions(
  stationId: string,
): Promise<TideConditions | null> {
  try {
    const today = new Date();
    const dateStr = formatDate(today);

    const url =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
      `?begin_date=${dateStr}&end_date=${dateStr}` +
      `&station=${stationId}` +
      `&product=predictions` +
      `&datum=MLLW` +
      `&units=english` +
      `&time_zone=lst_ldt` +
      `&interval=6` +
      `&format=json`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`NOAA Tides API error: ${res.status} for station ${stationId}`);
      return null;
    }

    const data: NOAATideResponse = await res.json();
    if (!data.predictions || data.predictions.length === 0) {
      console.error(`No tide predictions for station ${stationId}`);
      return null;
    }

    // Find the prediction closest to now
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    let closestIdx = 0;
    let closestDiff = Infinity;

    for (let i = 0; i < data.predictions.length; i++) {
      const timeParts = data.predictions[i].t.split(' ')[1]?.split(':');
      if (!timeParts) continue;
      const predMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
      const diff = Math.abs(predMinutes - nowMinutes);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }

    const currentHeight = parseFloat(data.predictions[closestIdx].v);

    // Determine tide state by comparing with neighboring predictions
    let tideState: TideConditions['tideState'];
    if (closestIdx > 0 && closestIdx < data.predictions.length - 1) {
      const prevHeight = parseFloat(data.predictions[closestIdx - 1].v);
      const nextHeight = parseFloat(data.predictions[closestIdx + 1].v);

      if (currentHeight > prevHeight && currentHeight > nextHeight) {
        tideState = 'high';
      } else if (currentHeight < prevHeight && currentHeight < nextHeight) {
        tideState = 'low';
      } else if (currentHeight >= prevHeight) {
        tideState = 'rising';
      } else {
        tideState = 'falling';
      }
    } else if (closestIdx === 0 && data.predictions.length > 1) {
      const nextHeight = parseFloat(data.predictions[1].v);
      tideState = currentHeight <= nextHeight ? 'rising' : 'falling';
    } else {
      tideState = 'rising'; // fallback
    }

    return {
      tideHeightFt: currentHeight,
      tideState,
    };
  } catch (err) {
    console.error('NOAA Tides fetch error:', err);
    return null;
  }
}
