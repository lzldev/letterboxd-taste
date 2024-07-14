import { type NextRequest, NextResponse } from "next/server";
import { scrapeNanogenres } from "~/lib/letterboxd/scrape/nanogenres";

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

  const nanogenres = await scrapeNanogenres(film).catch((err) => {
    console.error(err);
  });

  if (!nanogenres) {
    return NextResponse.json(
      { error: "Film not Found" },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(nanogenres);
}
