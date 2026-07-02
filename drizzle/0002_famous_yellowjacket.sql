ALTER TABLE `courses` ADD `price` integer DEFAULT 129 NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `format` text DEFAULT 'Virtual' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `venue` text DEFAULT 'Eventku Live' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `city` text DEFAULT 'Streaming worldwide' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `audience` text DEFAULT 'Training teams and operators' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `hero_note` text DEFAULT 'Live training event' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `host_bio` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `start_at` text DEFAULT '2026-01-01T00:00:00.000Z' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `end_at` text DEFAULT '2026-01-01T01:00:00.000Z' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `highlights` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `takeaways` text DEFAULT '[]' NOT NULL;