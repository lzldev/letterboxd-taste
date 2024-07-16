import { type NextRequest, NextResponse } from "next/server";
import { scrapeFilm } from "~/lib/letterboxd/scrape/film/genres";

export async function GET(
  _req: NextRequest,
  { params: { film } }: { params: { film: string } },
) {
  if (!film) {
    return NextResponse.json(
      {
        error: "Invalid Response",
      },
      {
        status: 400,
      },
    );
  }

  const genres = await scrapeFilm(film).catch((err) => {
    console.error(err);
  });

  if (!genres) {
    return NextResponse.json(
      { error: "Film not Found" },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(genres);
}
