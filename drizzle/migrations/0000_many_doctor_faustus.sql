CREATE TABLE `breaks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`region` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`orientation_deg` integer NOT NULL,
	`break_type` text NOT NULL,
	`optimal_swell_dir_min` integer NOT NULL,
	`optimal_swell_dir_max` integer NOT NULL,
	`optimal_wind_dir` text NOT NULL,
	`optimal_tide_low` real NOT NULL,
	`optimal_tide_high` real NOT NULL,
	`nearest_tide_station` text,
	`nearest_buoy_station` text
);
--> statement-breakpoint
CREATE TABLE `conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`break_id` text NOT NULL,
	`fetched_at` text NOT NULL,
	`wave_height_ft` real,
	`swell_period_s` real,
	`swell_direction_deg` integer,
	`wind_speed_mph` real,
	`wind_direction_deg` integer,
	`tide_height_ft` real,
	`tide_state` text,
	`quality_score` integer,
	`quality_label` text,
	FOREIGN KEY (`break_id`) REFERENCES `breaks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_breaks` (
	`user_id` text NOT NULL,
	`break_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `break_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`break_id`) REFERENCES `breaks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`location_lat` real NOT NULL,
	`location_lng` real NOT NULL,
	`preferred_time` text DEFAULT '05:30' NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`unsubscribe_token` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);