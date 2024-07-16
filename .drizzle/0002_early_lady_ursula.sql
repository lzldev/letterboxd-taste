ALTER TABLE "letterbox-taste_users" ALTER COLUMN "network" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "letterbox-taste_users" ALTER COLUMN "network" SET DEFAULT '{"followers":[],"following":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "letterbox-taste_users" ALTER COLUMN "film_stats" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "letterbox-taste_users" ALTER COLUMN "film_stats" SET DEFAULT '{"avgRating":0,"watched":0,"films":[],"rated":0,"liked":0}'::jsonb;