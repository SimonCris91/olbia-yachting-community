ALTER TABLE `profiles` ADD COLUMN `telegram` text;
--> statement-breakpoint
CREATE TABLE `operators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`category` text NOT NULL,
	`locations` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`telegram` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_operators_owner_user_id` ON `operators` (`owner_user_id`);
--> statement-breakpoint
CREATE INDEX `idx_operators_category_active` ON `operators` (`category`,`active`);
--> statement-breakpoint
PRAGMA optimize;
