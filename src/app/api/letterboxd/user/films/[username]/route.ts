import { type NextRequest, NextResponse } from "next/server";
import { scrapeUserFilms } from "~/lib/letterboxd/scrape/user/films";

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

  const films = await scrapeUserFilms(username, 1);

  return NextResponse.json({
    films,
  });
}
