import { type NextRequest, NextResponse } from "next/server";
import { scrapeUserDiary } from "~/lib/letterboxd/scrape/user/diary";
import { scrapeUserFilms } from "~/lib/letterboxd/scrape/user/films";
import { scrapeNetwork } from "~/lib/letterboxd/scrape/user/network";
import { scrapeUserProfile } from "~/lib/letterboxd/scrape/user/profile";

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

  const profile = await scrapeUserProfile(username);

  const [network, films] = await Promise.all([
    await scrapeNetwork(username, profile.following, profile.followers),
    await scrapeUserFilms(username, profile.films),
  ]);

  return NextResponse.json({
    profile,
    network,
    films,
  });
}
