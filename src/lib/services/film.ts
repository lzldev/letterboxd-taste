import { db } from "~/server/db";
import { scrapeFilm } from "../letterboxd/scrape/film/genres";
import { Effect } from "effect";
import { films, genres } from "~/server/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import {
  array_agg,
  json_agg,
  json_build_object,
  json_object_agg,
} from "../drizzle/aggregations";

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
  const scrape = await scrapeFilm(uri);

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

export async function getOrScrapeManyFilms(uri: string[]): Promise<Film[]> {
  const query = (
    await db
      .select({
        uris: array_agg(films.uri),
        films: json_agg(films),
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

  const inserts = await Promise.all(
    new Array(missing.length).fill(null).map(async (_, i) => {
      const uri = missing[i]!;
      const film = await scrapeFilm(uri);
      const genres = film.genres.map((name) => genreNameMap[name]!);
      return {
        uri,
        title: film.title,
        genres,
      } satisfies typeof films.$inferInsert;
    }),
  );

  const insert = await db.insert(films).values(inserts).returning();

  return [...query.films, ...insert];
}

export async function getOrScrapeManyFilmsAsMap(
  uri: string[],
): Promise<Record<string, PartialFilm>> {
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

  const p = (uri: string) =>
    Effect.promise(async () => {
      const film = await scrapeFilm(uri);
      const genres = film.genres.map((name) => genreNameMap[name]!);
      return {
        uri,
        title: film.title,
        genres,
      } satisfies typeof films.$inferInsert;
    });

  const d = (uri: string) =>
    Effect.tryPromise({
      try: async () => {
        const film = await scrapeFilm(uri);
        const genres = film.genres.map((name) => genreNameMap[name]!);
        return {
          uri,
          title: film.title,
          genres,
        } satisfies typeof films.$inferInsert;
      },
      catch: () => {
        return "nop";
      },
    });

  const inserts = await Promise.all(
    new Array(missing.length).fill(null).map(async (_, i) => {
      const uri = missing[i]!;
      const film = await scrapeFilm(uri);
      const genres = film.genres.map((name) => genreNameMap[name]!);
      return {
        uri,
        title: film.title,
        genres,
      } satisfies typeof films.$inferInsert;
    }),
  );

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
