CREATE TABLE IF NOT EXISTS "letterbox-taste_films" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"uri" varchar(100) NOT NULL,
	"genres_ids" integer,
	CONSTRAINT "letterbox-taste_films_uri_unique" UNIQUE("uri")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "letterbox-taste_genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "letterbox-taste_genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "letterbox-taste_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "letterbox-taste_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"displayName" varchar(100) NOT NULL,
	"network" json DEFAULT '{"followers":[],"following":[]}'::json NOT NULL,
	"film_stats" json DEFAULT '{"avg":0,"watched":0,"films":[],"rated":0}'::json NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "letterbox-taste_users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "film_uri_idx" ON "letterbox-taste_films" USING btree ("uri");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "genre_name_idx" ON "letterbox-taste_genres" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "letterbox-taste_post" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_username_idx" ON "letterbox-taste_users" USING btree ("name");