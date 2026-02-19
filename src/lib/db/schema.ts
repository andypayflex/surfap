import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  locationLat: real('location_lat').notNull(),
  locationLng: real('location_lng').notNull(),
  preferredTime: text('preferred_time').notNull().default('05:30'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  unsubscribeToken: text('unsubscribe_token').notNull(),
  createdAt: text('created_at').notNull(),
});

export const breaks = sqliteTable('breaks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  orientationDeg: integer('orientation_deg').notNull(),
  breakType: text('break_type', { enum: ['beach', 'reef', 'point'] }).notNull(),
  optimalSwellDirMin: integer('optimal_swell_dir_min').notNull(),
  optimalSwellDirMax: integer('optimal_swell_dir_max').notNull(),
  optimalWindDir: text('optimal_wind_dir').notNull(),
  optimalTideLow: real('optimal_tide_low').notNull(),
  optimalTideHigh: real('optimal_tide_high').notNull(),
  nearestTideStation: text('nearest_tide_station'),
  nearestBuoyStation: text('nearest_buoy_station'),
  exposureFactor: real('exposure_factor').notNull().default(0.7),
});

export const userBreaks = sqliteTable('user_breaks', {
  userId: text('user_id').notNull().references(() => users.id),
  breakId: text('break_id').notNull().references(() => breaks.id),
}, (table) => [
  primaryKey({ columns: [table.userId, table.breakId] }),
]);

export const conditions = sqliteTable('conditions', {
  id: text('id').primaryKey(),
  breakId: text('break_id').notNull().references(() => breaks.id),
  fetchedAt: text('fetched_at').notNull(),
  waveHeightFt: real('wave_height_ft'),
  swellHeightFt: real('swell_height_ft'),
  faceHeightFt: real('face_height_ft'),
  swellPeriodS: real('swell_period_s'),
  swellDirectionDeg: integer('swell_direction_deg'),
  windSpeedMph: real('wind_speed_mph'),
  windDirectionDeg: integer('wind_direction_deg'),
  tideHeightFt: real('tide_height_ft'),
  tideState: text('tide_state', { enum: ['rising', 'falling', 'high', 'low'] }),
  qualityScore: integer('quality_score'),
  qualityLabel: text('quality_label'),
});
