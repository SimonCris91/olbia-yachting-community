CREATE TABLE `outreach_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`channel` text NOT NULL,
	`location` text NOT NULL,
	`reference` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_outreach_events_provider_channel_created` ON `outreach_events` (`provider_id`,`channel`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
