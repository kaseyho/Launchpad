CREATE TABLE `foundry_workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`stage` text NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `uploaded_files` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`r2_key` text NOT NULL,
	`uploaded_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uploaded_files_r2_key_unique` ON `uploaded_files` (`r2_key`);--> statement-breakpoint
CREATE INDEX `idx_uploaded_files_workspace_id` ON `uploaded_files` (`workspace_id`);