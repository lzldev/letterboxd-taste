import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { scrapeCategoryFilms } from "~/lib/letterboxd/scrape/category/films";

export async function GET(
  _req: NextRequest,
  { params: { category } }: { params: { category: string } },
) {
  if (!category) {
    return NextResponse.json(
      {
        error: "Invalid Response",
      },
      {
        status: 400,
      },
    );
  }

  const route = category.replaceAll(".", "/");

  const secret = _req.nextUrl.searchParams.get("secret");
  const start = parseInt(_req.nextUrl.searchParams.get("start")!);
  const count = parseInt(_req.nextUrl.searchParams.get("count")!);

  if (secret !== env.SCRAPER_SECRET || isNaN(start) || isNaN(count)) {
    return NextResponse.json({}, { status: 403 });
  }

  console.info(`[category] - ${route} - ${start} - ${count}`);

  void scrapeCategoryFilms(route, start, count).catch((err) => {
    console.error(err);
  });

  return NextResponse.json({
    message: "Starting",
    start,
    count,
    time: new Date().getTime(),
  });
}
