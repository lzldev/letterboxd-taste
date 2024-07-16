/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { load } from "cheerio";
import type { FilmEntry, UserFilmsStats } from "../../types";

const FILMS_PER_PAGE = 72;

export async function scrapeUserFilms(name: string, filmCount: number) {
  const totalPages = Math.ceil(filmCount / FILMS_PER_PAGE);

  const films = (
    await Promise.all(
      new Array(totalPages)
        .fill(null)
        .map((_, i) => scrapeFilmPage(name, i + 1)),
    )
  ).flat();

  const totalRating = films.reduce(
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
    } as {
      total: number;
      rated: number;
      liked: number;
    },
  );

  return {
    films,
    watched: films.length,
    liked: totalRating.liked,
    rated: totalRating.rated,
    avgRating: totalRating.total / totalRating.rated,
  } satisfies UserFilmsStats;
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
