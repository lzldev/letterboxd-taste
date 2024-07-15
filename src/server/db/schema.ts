// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  json,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type { UserFilmsStats, Network } from "~/lib/letterboxd/types";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `letterbox-taste_${name}`);

export const users = createTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("name", { length: 100 }).notNull().unique(),
    displayName: varchar("displayName", { length: 100 }).notNull(),
    network: json("network")
      .notNull()
      .$type<Network>()
      .default({ followers: [], following: [] }),
    filmStats: json("film_stats")
      .notNull()
      .$type<UserFilmsStats>()
      .default({ avg: 0, watched: 0, films: [], rated: 0 }),
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
    title: varchar("title", { length: 100 }).notNull(),
    uri: varchar("uri", { length: 100 }).notNull().unique(),
    genres: integer("genres_ids"),
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
