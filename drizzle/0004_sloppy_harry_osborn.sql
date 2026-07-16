CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`enrollment_id` integer,
	`confirmation_code` text NOT NULL,
	`buyer_name` text NOT NULL,
	`buyer_email` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'paid' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_confirmation_code_idx` ON `orders` (`confirmation_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_enrollment_id_idx` ON `orders` (`enrollment_id`);