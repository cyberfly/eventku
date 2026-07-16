PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organizer_id` integer,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`category` text NOT NULL,
	`level` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`duration_hours` integer NOT NULL,
	`seat_cap` integer NOT NULL,
	`completion_rate` integer NOT NULL,
	`instructor_name` text NOT NULL,
	`accent` text NOT NULL,
	`price` integer DEFAULT 129 NOT NULL,
	`format` text DEFAULT 'Virtual' NOT NULL,
	`venue` text DEFAULT 'Eventmu Live' NOT NULL,
	`city` text DEFAULT 'Streaming worldwide' NOT NULL,
	`audience` text DEFAULT 'Training teams and operators' NOT NULL,
	`hero_note` text DEFAULT 'Live training event' NOT NULL,
	`host_bio` text DEFAULT '' NOT NULL,
	`start_at` text DEFAULT '2026-01-01T00:00:00.000Z' NOT NULL,
	`end_at` text DEFAULT '2026-01-01T01:00:00.000Z' NOT NULL,
	`highlights` text DEFAULT '[]' NOT NULL,
	`takeaways` text DEFAULT '[]' NOT NULL,
	`featured_image` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`organizer_id`) REFERENCES `organizers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "organizer_id", "slug", "title", "summary", "category", "level", "status", "duration_hours", "seat_cap", "completion_rate", "instructor_name", "accent", "price", "format", "venue", "city", "audience", "hero_note", "host_bio", "start_at", "end_at", "highlights", "takeaways", "featured_image", "created_at") SELECT "id", "organizer_id", "slug", "title", "summary", "category", "level", "status", "duration_hours", "seat_cap", "completion_rate", "instructor_name", "accent", "price", "format", "venue", "city", "audience", "hero_note", "host_bio", "start_at", "end_at", "highlights", "takeaways", "featured_image", "created_at" FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_idx` ON `courses` (`slug`);