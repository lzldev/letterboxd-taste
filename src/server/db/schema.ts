// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import type { UserFilmsStats, Network } from "~/lib/letterboxd/types";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `letterbox-taste_${name}`);

export const customJsonb = customType<{ data: any }>({
  dataType() {
    return "jsonb";
  },
  toDriver(val) {
    // console.log("🚀 ~ toDriver:", val);
    return val as unknown;
  },
  fromDriver(value) {
    // console.log("🚀 ~ fromDriver", value);
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as unknown;
      } catch {}
    }
    return value;
  },
});

export const users = createTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("name", { length: 100 }).notNull().unique(),
    displayName: varchar("displayName", { length: 100 }).notNull(),
    network: customJsonb("network")
      .notNull()
      .$type<Network>()
      .default({ followers: [], following: [], scraped: false }),
    filmStats: customJsonb("film_stats")
      .notNull()
      .$type<UserFilmsStats>()
      .default({ avgRating: 0, watched: 0, films: [], rated: 0, liked: 0 }),
    tasteProfile: vector("taste_profile", {
      dimensions: 27,
    }),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    usernameIndex: index("user_username_idx").on(table.username),
  }),
);

export const genres = createTable(
  "genres",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", {
      length: 50,
    })
      .unique()
      .notNull(),
  },
  (table) => ({
    nameIndex: index("genre_name_idx").on(table.name),
  }),
);

export const films = createTable(
  "films",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 150 }).notNull(),
    uri: varchar("uri", { length: 150 }).notNull().unique(),
    genres: integer("genres_ids")
      .array()
      .notNull()
      .default(sql`ARRAY[]::integer[]`),
  },
  (table) => ({
    filmUriIndex: index("film_uri_idx").on(table.uri),
  }),
);

export const posts = createTable(
  "post",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  }),
);
