import { db } from "~/server/db";
import { scrapeFilm } from "../letterboxd/scrape/film/genres";
import { films, genres } from "~/server/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export type Film = Awaited<ReturnType<typeof getOrScrapeFilm>>;

export async function getOrScrapeFilm(uri: string) {
  const film = await db.query.films.findFirst({
    where: eq(films.uri, uri),
  });

  if (!film) {
    return await scrapeAndInsetFilm(uri);
  }

  return film;
}

export async function scrapeAndInsetFilm(uri: string) {
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

export async function getOrScrapeManyFilms(
  uri: string[],
): Promise<(typeof films.$inferSelect)[]> {
  const query = await db.select().from(films).where(inArray(films.uri, uri));

  const foundFilms = new Set(query.map((q) => q.uri));
  const missing = uri.filter((u) => !foundFilms.has(u));

  if (missing.length === 0) {
    return query;
  }

  const genreMap = (
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
      const genres = film.genres.map((name) => genreMap[name]!);
      return {
        uri,
        title: film.title,
        genres,
      } satisfies typeof films.$inferInsert;
    }),
  );

  const insert = await db.insert(films).values(inserts).returning();

  return [...query, ...insert];
}
