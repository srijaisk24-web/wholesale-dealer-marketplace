CREATE TABLE `dealer` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`business_name` text NOT NULL,
	`gst_number` text NOT NULL,
	`address` text NOT NULL,
	`phone` text NOT NULL,
	`license_number` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dealer_gst_number_unique` ON `dealer` (`gst_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `dealer_license_number_unique` ON `dealer` (`license_number`);--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` integer NOT NULL,
	`invoice_number` text NOT NULL,
	`dealer_id` integer NOT NULL,
	`buyer_dealer_id` integer NOT NULL,
	`subtotal` real NOT NULL,
	`gst_amount` real NOT NULL,
	`total` real NOT NULL,
	`invoice_date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `request`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dealer_id`) REFERENCES `dealer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`buyer_dealer_id`) REFERENCES `dealer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_invoice_number_unique` ON `invoice` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `payment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`amount` real NOT NULL,
	`payment_date` text NOT NULL,
	`payment_method` text NOT NULL,
	`transaction_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_transaction_id_unique` ON `payment` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `product` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dealer_id` integer NOT NULL,
	`name` text NOT NULL,
	`batch_number` text NOT NULL,
	`quantity` integer NOT NULL,
	`mrp` real NOT NULL,
	`dealer_price` real NOT NULL,
	`expiry_date` text NOT NULL,
	`manufacturing_date` text NOT NULL,
	`manufacturer` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`dealer_id`) REFERENCES `dealer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `request` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requesting_dealer_id` integer NOT NULL,
	`responding_dealer_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`request_date` text NOT NULL,
	`response_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`requesting_dealer_id`) REFERENCES `dealer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`responding_dealer_id`) REFERENCES `dealer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
