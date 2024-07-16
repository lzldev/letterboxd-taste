import { type NextRequest, NextResponse } from "next/server";
import { getOrScrapeManyFilms } from "~/lib/services/film";
import { getOrScrapeUser } from "~/lib/services/user";

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
  const uris = user.filmStats.films.map((film) => film.uri);
  const films = await getOrScrapeManyFilms(uris);

  return NextResponse.json({
    user,
    films,
  });
}
