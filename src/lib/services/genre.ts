import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { genres } from "~/server/db/schema";
import { json_build_object, json_object_agg } from "../drizzle/aggregations";

export async function genreAverageMap() {
  return (
    await db
      .select({
        map: json_object_agg(
          genres.id,
          json_build_object({
            name: genres.name,
            total: sql<number>`0`,
            n: sql<number>`0`,
          }),
        ),
      })
      .from(genres)
  ).at(0)!.map;
}
