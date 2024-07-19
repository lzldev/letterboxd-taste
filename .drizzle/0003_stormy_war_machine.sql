ALTER TABLE "letterbox-taste_films" ALTER COLUMN "title" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "letterbox-taste_films" ALTER COLUMN "uri" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "letterbox-taste_users" ALTER COLUMN "network" SET DEFAULT '{"followers":[],"following":[],"scraped":false}'::jsonb;