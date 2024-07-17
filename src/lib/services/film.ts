import { db } from "~/server/db";
import { scrapeFilmGenres } from "../letterboxd/scrape/film/genres";
import { Array, Effect } from "effect";
import { films, genres } from "~/server/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import {
  array_agg,
  json_agg,
  json_build_object,
  json_object_agg,
} from "../drizzle/aggregations";
import { PartialFilmRecord } from "../letterboxd/types";

export type Film = typeof films.$inferSelect;
export type PartialFilm = {
  genres: number[];
};

export async function getOrScrapeFilm(uri: string): Promise<Film> {
  const film = await db.query.films.findFirst({
    where: eq(films.uri, uri),
  });

  if (!film) {
    return await scrapeAndInsertFilm(uri);
  }

  return film;
}

export async function scrapeAndInsertFilm(uri: string): Promise<Film> {
  const scrape = await scrapeFilmGenres(uri);

  const g = await db
    .select({
      id: genres.id,
    })
    .from(genres)
    .where(inArray(genres.name, scrape.genres));

  const insert = await db
    .insert(films)
    .values({
      title: scrape.title,
      uri,
      genres: g.map((g) => g.id),
    })
    .returning();

  return insert.at(0)!;
}

export async function BulkScrapeFilmGenres(
  uri: string[],
): Promise<PartialFilmRecord> {
  const query = (
    await db
      .select({
        uris: array_agg(films.uri),
        films: json_object_agg(
          films.uri,
          json_build_object({
            genres: films.genres,
          }),
        ),
      })
      .from(films)
      .where(inArray(films.uri, uri))
  ).at(0)!;

  const foundFilms = new Set(query.uris);
  const missing = uri.filter((u) => !foundFilms.has(u));

  if (missing.length === 0) {
    return query.films;
  }

  const genreNameMap = (
    await db
      .select({
        map: sql<
          Record<string, number>
        >`json_object_agg(${genres.name},${genres.id})`,
      })
      .from(genres)
  ).at(0)!.map;

  const effects = Array.range(0, missing.length - 1).map((_, i) =>
    Effect.promise(async () => {
      const uri = missing[i]!;
      const film = await scrapeFilmGenres(uri);
      const genres = film.genres.map((name) => genreNameMap[name]!);
      return {
        uri,
        title: film.title,
        genres,
      } satisfies typeof films.$inferInsert;
    }),
  );

  const inserts = await Effect.all(effects, {
    concurrency: 20,
  }).pipe(Effect.runPromise);

  const insert = await db.insert(films).values(inserts).returning({
    id: films.id,
  });

  const query2 = (
    await db
      .select({
        map2: json_object_agg(
          films.uri,
          json_build_object({
            genres: films.genres,
          }),
        ),
      })
      .from(films)
      .where(
        inArray(
          films.id,
          insert.map((i) => i.id),
        ),
      )
  ).at(0)!.map2;

  return { ...query.films, ...query2 };
}
