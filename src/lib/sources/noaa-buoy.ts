// NOAA NDBC Buoy Data Parser
// Fetches real-time observations from plain-text files
// Docs: https://www.ndbc.noaa.gov/docs/ndbc_web_data_guide.pdf

export interface BuoyObservation {
  waveHeightFt: number;
  dominantPeriodS: number;
  windSpeedMph: number;
  windDirectionDeg: number;
  timestamp: Date;
}

const METERS_TO_FEET = 3.28084;
const MS_TO_MPH = 2.23694;

/**
 * Fetch and parse the latest real-time observation from an NDBC buoy station.
 * The data is in a fixed-width text format with two header rows.
 */
export async function fetchBuoyData(
  stationId: string,
): Promise<BuoyObservation | null> {
  try {
    const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`NOAA NDBC error: ${res.status} for station ${stationId}`);
      return null;
    }

    const text = await res.text();
    const lines = text.trim().split('\n');

    // Need at least header + units + 1 data row
    if (lines.length < 3) {
      console.error(`Insufficient buoy data for station ${stationId}`);
      return null;
    }

    // Parse header to find column indices
    const headers = lines[0].replace(/^#/, '').trim().split(/\s+/);
    // Data starts at line 2 (line 1 is units)
    const values = lines[2].trim().split(/\s+/);

    const getCol = (name: string): number | null => {
      const idx = headers.indexOf(name);
      if (idx === -1 || !values[idx] || values[idx] === 'MM') return null;
      return parseFloat(values[idx]);
    };

    const year = getCol('YY');
    const month = getCol('MM');
    const day = getCol('DD');
    const hour = getCol('hh');
    const minute = getCol('mm');

    // Wave height in meters (WVHT), dominant period in seconds (DPD)
    const wvht = getCol('WVHT');
    const dpd = getCol('DPD');
    // Wind speed in m/s (WSPD), wind direction in degrees (WDIR)
    const wspd = getCol('WSPD');
    const wdir = getCol('WDIR');

    if (wvht === null && dpd === null && wspd === null) {
      console.error(`No usable buoy data for station ${stationId}`);
      return null;
    }

    const timestamp =
      year && month && day && hour !== null && minute !== null
        ? new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0))
        : new Date();

    return {
      waveHeightFt: (wvht ?? 0) * METERS_TO_FEET,
      dominantPeriodS: dpd ?? 0,
      windSpeedMph: (wspd ?? 0) * MS_TO_MPH,
      windDirectionDeg: wdir ?? 0,
      timestamp,
    };
  } catch (err) {
    console.error('NOAA NDBC fetch error:', err);
    return null;
  }
}
