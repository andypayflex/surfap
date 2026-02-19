CREATE TABLE "forecasts" (
	"id" text PRIMARY KEY NOT NULL,
	"break_id" text NOT NULL,
	"forecast_date" text NOT NULL,
	"fetched_at" text NOT NULL,
	"wave_height_ft" double precision,
	"swell_height_ft" double precision,
	"face_height_ft" double precision,
	"swell_period_s" double precision,
	"swell_direction_deg" integer,
	"wind_speed_mph" double precision,
	"wind_direction_deg" integer,
	"tide_height_ft" double precision,
	"tide_state" text,
	"quality_score" integer,
	"quality_label" text
);
--> statement-breakpoint
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;