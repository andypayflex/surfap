// Open-Meteo Marine API client
// Docs: https://open-meteo.com/en/docs/marine-weather-api

const METERS_TO_FEET = 3.28084;
const KMH_TO_MPH = 0.621371;

export interface MarineConditions {
  waveHeightFt: number;
  swellHeightFt: number;
  swellPeriodS: number;
  swellDirectionDeg: number;
  windWaveHeightFt: number;
  windSpeedMph: number;
  windDirectionDeg: number;
}

interface OpenMeteoMarineResponse {
  hourly: {
    time: string[];
    wave_height: (number | null)[];
    wave_period: (number | null)[];
    wave_direction: (number | null)[];
    swell_wave_height: (number | null)[];
    swell_wave_period: (number | null)[];
    swell_wave_direction: (number | null)[];
    wind_wave_height: (number | null)[];
  };
}

interface OpenMeteoForecastResponse {
  hourly: {
    time: string[];
    wind_speed_10m: (number | null)[];
    wind_direction_10m: (number | null)[];
  };
}

/**
 * Fetch current marine conditions for a lat/lng from Open-Meteo.
 * Returns the data for the current hour (or nearest available).
 */
export interface MarineForecastDay {
  date: string; // "2026-02-20"
  waveHeightFt: number;
  swellHeightFt: number;
  swellPeriodS: number;
  swellDirectionDeg: number;
  windWaveHeightFt: number;
  windSpeedMph: number;
  windDirectionDeg: number;
}

/**
 * Fetch multi-day marine forecast for a lat/lng.
 * Groups hourly data by date and picks 7 AM local hour as representative.
 * Returns array of MarineForecastDay (one per day, including today).
 */
export async function fetchMarineForecast(
  latitude: number,
  longitude: number,
  days: number = 7,
): Promise<MarineForecastDay[] | null> {
  try {
    const [marineRes, forecastRes] = await Promise.all([
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height` +
        `&timezone=auto&forecast_days=${days}`,
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=wind_speed_10m,wind_direction_10m` +
        `&timezone=auto&forecast_days=${days}`,
      ),
    ]);

    if (!marineRes.ok || !forecastRes.ok) {
      console.error(`Open-Meteo forecast API error: marine=${marineRes.status} forecast=${forecastRes.status}`);
      return null;
    }

    const marine: OpenMeteoMarineResponse = await marineRes.json();
    const forecast: OpenMeteoForecastResponse = await forecastRes.json();

    // Group by date, pick 7 AM (index "T07") as representative hour
    const dayMap = new Map<string, number>();
    for (let i = 0; i < marine.hourly.time.length; i++) {
      const t = marine.hourly.time[i]; // "2026-02-20T07:00"
      if (t.includes('T07:')) {
        const date = t.split('T')[0];
        dayMap.set(date, i);
      }
    }

    const windMap = new Map<string, number>();
    for (let i = 0; i < forecast.hourly.time.length; i++) {
      const t = forecast.hourly.time[i];
      if (t.includes('T07:')) {
        const date = t.split('T')[0];
        windMap.set(date, i);
      }
    }

    const result: MarineForecastDay[] = [];
    for (const [date, idx] of dayMap) {
      const windIdx = windMap.get(date) ?? 0;
      result.push({
        date,
        waveHeightFt: (marine.hourly.wave_height[idx] ?? 0) * METERS_TO_FEET,
        swellHeightFt: (marine.hourly.swell_wave_height[idx] ?? 0) * METERS_TO_FEET,
        swellPeriodS: marine.hourly.swell_wave_period[idx] ?? 0,
        swellDirectionDeg: marine.hourly.swell_wave_direction[idx] ?? 0,
        windWaveHeightFt: (marine.hourly.wind_wave_height[idx] ?? 0) * METERS_TO_FEET,
        windSpeedMph: (forecast.hourly.wind_speed_10m[windIdx] ?? 0) * KMH_TO_MPH,
        windDirectionDeg: forecast.hourly.wind_direction_10m[windIdx] ?? 0,
      });
    }

    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  } catch (err) {
    console.error('Open-Meteo forecast fetch error:', err);
    return null;
  }
}

export async function fetchMarineConditions(
  latitude: number,
  longitude: number,
): Promise<MarineConditions | null> {
  try {
    // Fetch marine data and wind data in parallel
    const [marineRes, forecastRes] = await Promise.all([
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height` +
        `&timezone=auto&forecast_days=1`,
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=wind_speed_10m,wind_direction_10m` +
        `&timezone=auto&forecast_days=1`,
      ),
    ]);

    if (!marineRes.ok || !forecastRes.ok) {
      console.error(`Open-Meteo API error: marine=${marineRes.status} forecast=${forecastRes.status}`);
      return null;
    }

    const marine: OpenMeteoMarineResponse = await marineRes.json();
    const forecast: OpenMeteoForecastResponse = await forecastRes.json();

    // Find the index for the current hour
    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13); // "2026-02-19T07"
    let idx = marine.hourly.time.findIndex((t) => t.startsWith(currentHour));
    if (idx === -1) idx = 0; // fallback to first entry

    const waveHeight = marine.hourly.wave_height[idx];
    const swellHeight = marine.hourly.swell_wave_height[idx];
    const swellPeriod = marine.hourly.swell_wave_period[idx];
    const swellDir = marine.hourly.swell_wave_direction[idx];
    const windWaveHeight = marine.hourly.wind_wave_height[idx];

    // Wind data from forecast API
    let windIdx = forecast.hourly.time.findIndex((t) => t.startsWith(currentHour));
    if (windIdx === -1) windIdx = 0;
    const windSpeed = forecast.hourly.wind_speed_10m[windIdx];
    const windDir = forecast.hourly.wind_direction_10m[windIdx];

    return {
      waveHeightFt: (waveHeight ?? 0) * METERS_TO_FEET,
      swellHeightFt: (swellHeight ?? 0) * METERS_TO_FEET,
      swellPeriodS: swellPeriod ?? 0,
      swellDirectionDeg: swellDir ?? 0,
      windWaveHeightFt: (windWaveHeight ?? 0) * METERS_TO_FEET,
      windSpeedMph: (windSpeed ?? 0) * KMH_TO_MPH,
      windDirectionDeg: windDir ?? 0,
    };
  } catch (err) {
    console.error('Open-Meteo fetch error:', err);
    return null;
  }
}
