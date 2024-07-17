import { type NextRequest, NextResponse } from "next/server";
import { ScrapeUser } from "~/lib/services/user";
import { WalkUserNetwork } from "~/lib/services/network";
import { BulkScrapeFilmGenres } from "~/lib/services/film";
import { classifyNetworkTaste, fetchNetworkTaste } from "~/lib/services/taste";
import { genreAverageMap } from "~/lib/services/genre";

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

  if (!user) {
    return NextResponse.json(
      {
        error: "User not found",
      },
      {
        status: 404,
      },
    );
  }

  console.time(`[WALK_NETWORK] ${username}`);
  const state = { userSet: new Set<string>(), films: new Set<string>() };
  const network = await WalkUserNetwork(user, state, 1);
  console.timeEnd(`[WALK_NETWORK] ${username}`);

  console.time("BULK SCRAPE FILMS");
  const films = await BulkScrapeFilmGenres(Array.from(state.films.values()));
  console.timeEnd("BULK SCRAPE FILMS");

  await classifyNetworkTaste(network.at(0)!, films, await genreAverageMap());

  const taste = await fetchNetworkTaste(username, 1);

  return NextResponse.json({
    taste,
  });
}
