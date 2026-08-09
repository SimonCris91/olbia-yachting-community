CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`email` text,
	`display_name` text,
	`role` text DEFAULT 'private' NOT NULL,
	`plan` text DEFAULT 'standard' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_user_id` ON `profiles` (`user_id`);
--> statement-breakpoint
CREATE TABLE `ai_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject` text NOT NULL,
	`day` text NOT NULL,
	`requests` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ai_usage_subject_day` ON `ai_usage` (`subject`,`day`);
--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`location` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`accepted_by_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_service_requests_location_status` ON `service_requests` (`location`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_service_requests_owner` ON `service_requests` (`owner_user_id`);
--> statement-breakpoint
PRAGMA optimize;
