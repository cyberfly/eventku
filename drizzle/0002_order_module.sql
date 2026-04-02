CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`enrollment_id` integer REFERENCES enrollments(id) ON UPDATE no action ON DELETE set null,
	`course_id` integer REFERENCES courses(id) ON UPDATE no action ON DELETE set null,
	`attendee_name` text NOT NULL,
	`attendee_email` text NOT NULL,
	`price_at_purchase` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_idx` ON `orders` (`order_number`);
