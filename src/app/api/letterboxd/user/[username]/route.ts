import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getOrScrapeManyFilmsAsMap } from "~/lib/services/film";
import { genreAverageMap } from "~/lib/services/genre";
import { calculateUserTaste } from "~/lib/services/taste";
import { ScrapeUser } from "~/lib/services/user";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

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

  const user = await ScrapeUser(username);
  const films = await getOrScrapeManyFilmsAsMap(
    user.filmStats.films.map((film) => film.uri),
  );
  const genreMap = await genreAverageMap();
  const taste = calculateUserTaste(user.filmStats, films, genreMap);

  await db
    .update(users)
    .set({
      tasteProfile: taste,
    })
    .where(eq(users.username, username));

  return NextResponse.json({
    user,
    films,
    genreMap,
    taste,
  });
}
