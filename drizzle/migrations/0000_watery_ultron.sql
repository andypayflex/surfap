CREATE TABLE "breaks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"orientation_deg" integer NOT NULL,
	"break_type" text NOT NULL,
	"optimal_swell_dir_min" integer NOT NULL,
	"optimal_swell_dir_max" integer NOT NULL,
	"optimal_wind_dir" text NOT NULL,
	"optimal_tide_low" double precision NOT NULL,
	"optimal_tide_high" double precision NOT NULL,
	"nearest_tide_station" text,
	"nearest_buoy_station" text,
	"exposure_factor" double precision DEFAULT 0.7 NOT NULL,
	"webcam_url" text
);
--> statement-breakpoint
CREATE TABLE "conditions" (
	"id" text PRIMARY KEY NOT NULL,
	"break_id" text NOT NULL,
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
CREATE TABLE "user_breaks" (
	"user_id" text NOT NULL,
	"break_id" text NOT NULL,
	CONSTRAINT "user_breaks_user_id_break_id_pk" PRIMARY KEY("user_id","break_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"location_lat" double precision NOT NULL,
	"location_lng" double precision NOT NULL,
	"preferred_time" text DEFAULT '05:30' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_breaks" ADD CONSTRAINT "user_breaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_breaks" ADD CONSTRAINT "user_breaks_break_id_breaks_id_fk" FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id") ON DELETE no action ON UPDATE no action;