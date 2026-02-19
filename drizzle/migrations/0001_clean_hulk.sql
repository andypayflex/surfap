ALTER TABLE `breaks` ADD `exposure_factor` real DEFAULT 0.7 NOT NULL;--> statement-breakpoint
ALTER TABLE `breaks` ADD `webcam_url` text;--> statement-breakpoint
ALTER TABLE `conditions` ADD `swell_height_ft` real;--> statement-breakpoint
ALTER TABLE `conditions` ADD `face_height_ft` real;