CREATE TABLE `organizer_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organizer_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`organizer_id`) REFERENCES `organizers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizer_sessions_token_idx` ON `organizer_sessions` (`token`);--> statement-breakpoint
CREATE TABLE `organizers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizers_email_idx` ON `organizers` (`email`);--> statement-breakpoint
ALTER TABLE `courses` ADD `organizer_id` integer REFERENCES organizers(id);--> statement-breakpoint
ALTER TABLE `courses` ADD `status` text DEFAULT 'published' NOT NULL;