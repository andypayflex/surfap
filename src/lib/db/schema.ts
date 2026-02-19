import { pgTable, text, integer, doublePrecision, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  locationLat: doublePrecision('location_lat').notNull(),
  locationLng: doublePrecision('location_lng').notNull(),
  preferredTime: text('preferred_time').notNull().default('05:30'),
  emailVerified: boolean('email_verified').notNull().default(false),
  unsubscribeToken: text('unsubscribe_token').notNull(),
  createdAt: text('created_at').notNull(),
});

export const breaks = pgTable('breaks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  orientationDeg: integer('orientation_deg').notNull(),
  breakType: text('break_type', { enum: ['beach', 'reef', 'point'] }).notNull(),
  optimalSwellDirMin: integer('optimal_swell_dir_min').notNull(),
  optimalSwellDirMax: integer('optimal_swell_dir_max').notNull(),
  optimalWindDir: text('optimal_wind_dir').notNull(),
  optimalTideLow: doublePrecision('optimal_tide_low').notNull(),
  optimalTideHigh: doublePrecision('optimal_tide_high').notNull(),
  nearestTideStation: text('nearest_tide_station'),
  nearestBuoyStation: text('nearest_buoy_station'),
  exposureFactor: doublePrecision('exposure_factor').notNull().default(0.7),
  webcamUrl: text('webcam_url'),
});

export const userBreaks = pgTable('user_breaks', {
  userId: text('user_id').notNull().references(() => users.id),
  breakId: text('break_id').notNull().references(() => breaks.id),
}, (table) => [
  primaryKey({ columns: [table.userId, table.breakId] }),
]);

export const conditions = pgTable('conditions', {
  id: text('id').primaryKey(),
  breakId: text('break_id').notNull().references(() => breaks.id),
  fetchedAt: text('fetched_at').notNull(),
  waveHeightFt: doublePrecision('wave_height_ft'),
  swellHeightFt: doublePrecision('swell_height_ft'),
  faceHeightFt: doublePrecision('face_height_ft'),
  swellPeriodS: doublePrecision('swell_period_s'),
  swellDirectionDeg: integer('swell_direction_deg'),
  windSpeedMph: doublePrecision('wind_speed_mph'),
  windDirectionDeg: integer('wind_direction_deg'),
  tideHeightFt: doublePrecision('tide_height_ft'),
  tideState: text('tide_state', { enum: ['rising', 'falling', 'high', 'low'] }),
  qualityScore: integer('quality_score'),
  qualityLabel: text('quality_label'),
});

export const forecasts = pgTable('forecasts', {
  id: text('id').primaryKey(),
  breakId: text('break_id').notNull().references(() => breaks.id),
  forecastDate: text('forecast_date').notNull(),
  fetchedAt: text('fetched_at').notNull(),
  waveHeightFt: doublePrecision('wave_height_ft'),
  swellHeightFt: doublePrecision('swell_height_ft'),
  faceHeightFt: doublePrecision('face_height_ft'),
  swellPeriodS: doublePrecision('swell_period_s'),
  swellDirectionDeg: integer('swell_direction_deg'),
  windSpeedMph: doublePrecision('wind_speed_mph'),
  windDirectionDeg: integer('wind_direction_deg'),
  tideHeightFt: doublePrecision('tide_height_ft'),
  tideState: text('tide_state', { enum: ['rising', 'falling', 'high', 'low'] }),
  qualityScore: integer('quality_score'),
  qualityLabel: text('quality_label'),
});
