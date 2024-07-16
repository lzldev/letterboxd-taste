import { sql, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { array_agg, json_agg } from "~/lib/drizzle/aggregations";
import { getOrScrapeManyFilms } from "~/lib/services/film";
import { genreAverageMap } from "~/lib/services/genre";
import { getOrScrapeUser } from "~/lib/services/user";
import { db } from "~/server/db";
import { films } from "~/server/db/schema";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(
  _req: NextRequest,
  { params: { username } }: { params: { username: string } },
) {
  if (!username) {
    return NextResponse.json(
      {
        error: "No username",
      },
      {
        status: 400,
      },
    );
  }

  const user = await getOrScrapeUser(username);
  const films = await getOrScrapeManyFilms(
    user.filmStats.films.map((film) => film.uri),
  );
  const genreMap = await genreAverageMap();

  return NextResponse.json({
    user,
    films,
    genreMap,
  });
}
