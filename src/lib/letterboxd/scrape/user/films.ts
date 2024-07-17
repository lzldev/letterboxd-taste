/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { load } from "cheerio";
import type { FilmEntry, UserFilmsStats } from "../../types";
import { Chunk, Effect, Stream } from "effect";

const FILMS_PER_PAGE = 72;
const USER_FILM_CONCURRENCY = 10;

export async function scrapeUserFilms(name: string, filmCount: number) {
  const totalPages = Math.ceil(filmCount / FILMS_PER_PAGE);

  const films = await scrapeUserFilmsEffect(name, totalPages).pipe(
    Effect.runPromise,
  );

  const totalRating = calculateTotalRating(films);

  return {
    films,
    watched: films.length,
    liked: totalRating.liked,
    rated: totalRating.rated,
    avgRating: totalRating.total / totalRating.rated,
  } satisfies UserFilmsStats;
}

function scrapeUserFilmsEffect(name: string, totalPages: number) {
  return Stream.range(1, totalPages).pipe(
    Stream.map((p) => Effect.promise(() => scrapeFilmPage(name, p))),
    Stream.runCollect,
    Effect.runSync,
    Chunk.toArray,
    (films) =>
      Effect.all(films, {
        concurrency: USER_FILM_CONCURRENCY,
      }),
    Effect.map((films) => films.flat()),
  );
}

type TotalRating = {
  total: number;
  rated: number;
  liked: number;
};

function calculateTotalRating(entries: FilmEntry[]): TotalRating {
  return entries.reduce(
    (pv, cv) => {
      if (!cv.rating) {
        return pv;
      }

      return {
        total: pv.total + cv.rating,
        rated: pv.rated + 1,
        liked: cv.liked ? pv.liked + 1 : pv.liked,
      };
    },
    {
      total: 0,
      rated: 0,
      liked: 0,
    } as TotalRating,
  );
}

async function scrapeFilmPage(name: string, page = 1): Promise<FilmEntry[]> {
  const r = await fetch(`https://letterboxd.com/${name}/films/page/${page}`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch user diary", {
      cause: r,
    });
  }

  const html = load(await r.text());
  const films: FilmEntry[] = [];

  const posters = html(".film-poster");

  for (const poster of posters) {
    const uri = poster.attribs["data-film-slug"]!;

    const viewingData = poster.next!.next! as any;
    const first = viewingData.children[1]!;

    if (!first) {
      films.push({ uri, liked: false, rating: null });
      continue;
    }

    const firstClass = first.attribs.class;

    if (!firstClass.startsWith("rating")) {
      films.push({ uri, liked: first.name === "span", rating: null });
      continue;
    }

    films.push({
      uri,
      liked:
        !!viewingData.children[3] && viewingData.children[3].name === "span",
      rating: parseRatingClass(first.attribs.class) / 2,
    });
  }

  return films;
}

function parseRatingClass(ratingClass: string): number {
  const ratingEndIdx = ratingClass.lastIndexOf("-");
  const rt = ratingClass.substring(ratingEndIdx + 1);

  let rating = 0;
  try {
    rating = parseInt(rt) || 0;
  } catch (err) {}

  return rating;
}
