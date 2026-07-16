CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`course_id` integer,
	`enrollment_id` integer,
	`attendee_name` text NOT NULL,
	`attendee_email` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'MYR' NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`payment_status` text DEFAULT 'paid' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_idx` ON `orders` (`order_number`);
