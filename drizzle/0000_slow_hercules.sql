CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`category` text NOT NULL,
	`level` text NOT NULL,
	`duration_hours` integer NOT NULL,
	`seat_cap` integer NOT NULL,
	`completion_rate` integer NOT NULL,
	`instructor_name` text NOT NULL,
	`accent` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_idx` ON `courses` (`slug`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`learner_name` text NOT NULL,
	`learner_email` text NOT NULL,
	`status` text NOT NULL,
	`progress` integer NOT NULL,
	`enrolled_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`title` text NOT NULL,
	`lesson_type` text NOT NULL,
	`position` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`is_preview` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`position` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` integer NOT NULL,
	`author_name` text NOT NULL,
	`author_role` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_number` text NOT NULL,
	`course_id` integer,
	`subject` text NOT NULL,
	`summary` text NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`requester_name` text NOT NULL,
	`requester_email` text NOT NULL,
	`assignee_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_ticket_number_idx` ON `tickets` (`ticket_number`);