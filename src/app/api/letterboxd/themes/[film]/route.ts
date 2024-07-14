import { type NextRequest, NextResponse } from "next/server";
import { scrapeThemes } from "~/lib/letterboxd/scrape/themes";

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

  const themes = await scrapeThemes(film).catch((err) => {
    console.error(err);
  });

  if (!themes) {
    return NextResponse.json(
      { error: "Film not Found" },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(themes);
}
