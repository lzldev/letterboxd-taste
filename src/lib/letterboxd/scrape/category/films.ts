/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { load, text } from "cheerio";
import { inArray, sql } from "drizzle-orm";
import { Chunk, Effect, Stream } from "effect";
import { array_agg } from "~/lib/drizzle/aggregations";
import { db } from "~/server/db";
import { films, genres } from "~/server/db/schema";

const CATEGORY_FILM_CONCURRENCY = 20;

const genreNameMap = (
  await db
    .select({
      map: sql<
        Record<string, number>
      >`json_object_agg(${genres.name},${genres.id})`,
    })
    .from(genres)
).at(0)!.map;

export async function scrapeCategoryFilms(
  category: string,
  start: number,
  n: number,
) {
  const uris = await scrapeCategoryFilmsEffect(category, start, n).pipe(
    Effect.runPromise,
  );

  console.info(`Scraped - ${uris.length} URIS`);

  await bulkScrapeFilmsGenres(uris);

  return {
    uris,
  };
}

async function bulkScrapeFilmsGenres(uris: string[]) {
  const sq = (
    await db
      .select({
        uris: array_agg(films.uri),
      })
      .from(films)
      .where(inArray(films.uri, uris))
  ).at(0)!;

  const found = new Set(sq.uris);
  const notInDb = uris.filter((uri) => !found.has(uri));

  if (notInDb.length === 0) {
    console.info("no films in diff");
    return;
  }
  console.info(`Scraping and Inserting ${notInDb.length} FILMS`);

  const flms = await Effect.runPromise(bulklScrapegenres(notInDb));
  if (flms.length === 0) {
    console.info(`NO FILMS TO INSERT`);
    return;
  }

  await db.insert(films).values(flms).onConflictDoNothing();
  console.info(`INSERT - ${flms.length} INTO FILMS`);
}

function bulklScrapegenres(uris: string[]) {
  const p = uris.map((p) => Effect.promise(() => scrapeFilmGenres(p)));

  return Effect.all(p, {
    concurrency: CATEGORY_FILM_CONCURRENCY,
    mode: "validate",
  });
}

export async function scrapeFilmGenres(name: string) {
  const uri = `https://letterboxd.com/film/${name}/genres/`;
  const r = await fetch(uri);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch movie genres", {
      cause: r,
    });
  }

  const html = load(await r.text());
  const title = html(".filmtitle span").text();
  const els = html("#tab-genres .text-slug");
  const genres: number[] = [];

  for (const el of els) {
    const ref = el.attribs.href ?? "";

    if (!ref.startsWith("/films/genre")) {
      continue;
    }

    genres.push(genreNameMap[text(el.children)]!);
  }

  return {
    uri: name,
    title,
    genres,
  };
}

function scrapeCategoryFilmsEffect(
  name: string,
  startingPage: number,
  totalPages: number,
) {
  return Stream.range(startingPage, startingPage + totalPages).pipe(
    Stream.map((p) => Effect.promise(() => scrapeFilmPage(name, p))),
    Stream.runCollect,
    Effect.runSync,
    Chunk.toArray,
    (films) =>
      Effect.all(films, {
        concurrency: CATEGORY_FILM_CONCURRENCY,
      }),
    Effect.map((films) => films.flat()),
  );
}

async function scrapeFilmPage(route: string, page: number): Promise<string[]> {
  console.info(
    `fetch - ${`https://letterboxd.com/films/ajax/${route}/page/${page}`}`,
  );

  const r = await fetch(
    `https://letterboxd.com/films/ajax/${route}/page/${page}`,
  );

  if (r.status !== 200) {
    throw new Error("Couldn't fetch category page", {
      cause: r,
    });
  }

  const html = load(await r.text());
  const uris: string[] = [];

  const posters = html(".film-poster");

  for (const poster of posters) {
    const uri = poster.attribs["data-film-slug"]!;

    uris.push(uri);
  }

  return uris;
}
