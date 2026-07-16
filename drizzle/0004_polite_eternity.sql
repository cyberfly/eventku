CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`enrollment_id` integer,
	`course_id` integer,
	`attendee_name` text NOT NULL,
	`attendee_email` text NOT NULL,
	`price_at_purchase` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_idx` ON `orders` (`order_number`);