CREATE TABLE `workspace_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_workspace_items_owner_kind` ON `workspace_items` (`owner_user_id`,`kind`);
--> statement-breakpoint
PRAGMA optimize;
