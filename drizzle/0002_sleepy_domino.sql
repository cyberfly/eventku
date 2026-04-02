CREATE TABLE `checkout_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stripe_session_id` text NOT NULL,
	`course_id` integer NOT NULL,
	`attendee_name` text NOT NULL,
	`attendee_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkout_sessions_stripe_session_id_idx` ON `checkout_sessions` (`stripe_session_id`);