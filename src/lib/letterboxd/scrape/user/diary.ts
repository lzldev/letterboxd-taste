import { load, text, type Element } from "cheerio";

export async function scrapeUserDiary(name: string, page = 1) {
  const r = await fetch(
    `https://letterboxd.com/${name}/films/diary/page/${page}`,
  );

  if (r.status !== 200) {
    throw new Error("Couldn't fetch user diary", {
      cause: r,
    });
  }

  const html = load(await r.text());
  const pages = html(".paginate-pages .paginate-page");
  const hasMorePages = pages.length > 0;

  let lastPage = page;
  if (hasMorePages) {
    lastPage = parseInt(pages.last().text());
  }

  const films: { url: string; title: string; rating: number }[] = [];
  const titles = html(".td-film-details .headline-3 a");

  for (const link of titles) {
    const title = text(link.children);
    const ratingClass = ratingClassFromLink(link);

    /* Search Rating Span using Cheerio (~30x slower)
      const elems = html(".rating", link.parent!.parent!.parent).attr("class");
      const ratingClass = elems.attr("class")!;
    */

    const rating = parseRatingClass(ratingClass) / 2;
    films.push({ title, rating, url: link.attribs.href! });
  }

  const isFirstPage = page === 1;
  if (isFirstPage && hasMorePages) {
    const arr = await Promise.all(
      new Array(lastPage - 1)
        .fill(0)
        .map((_, i) => scrapeUserDiary(name, i + 2)),
    );

    films.push(...arr.flatMap((i) => i.films));
  }

  const avg_rating =
    films.reduce((pv, cv) => (pv += cv.rating), 0) / films.length;

  return {
    films,
    total: films.length,
    avg_rating: avg_rating.toFixed(2),
    lastPage,
  };
}

//prettier-ignore
function ratingClassFromLink(linkEl: Element): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    linkEl.parent!.parent!.next!.next!.next!.next!.children.at(3)!.children.at(1).attribs.class
  );
}

function parseRatingClass(ratingClass: string): number {
  const ratingEndIdx = ratingClass.lastIndexOf("-");
  const rt = ratingClass.substring(ratingEndIdx + 1);

  let rating = 0;
  try {
    rating = parseInt(rt, 10);
  } catch (err) {}
  if (Number.isNaN(rating)) {
    rating = 0;
  }

  return rating;
}
