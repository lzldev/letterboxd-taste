import { load, text, type Element } from "cheerio";
import { parseIntFromCheerioEl } from "../utils";
import { DiaryEntry } from "../../types";

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

  const lastPage = parseIntFromCheerioEl(pages.last());

  const films: DiaryEntry[] = [];
  const titles = html(".td-film-details .headline-3 a");

  for (const link of titles) {
    const ratingClass = ratingClassFromLink(link);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const liked = html(
      ".edit-review-button",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      link.parent!.parent!.parent as any,
    ).data("liked") as boolean;

    /* Search Rating Span using Cheerio (~30x slower)
      const elems = html(".rating", link.parent!.parent!.parent).attr("class");
      const ratingClass = elems.attr("class")!;
    */

    const rating = parseRatingClass(ratingClass) / 2;
    const uri = parseFilmUri(link.attribs.href!);

    films.push({ uri, rating, liked });
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

function parseFilmUri(href: string): string {
  return href.split("/").at(3)!;
}

function parseRatingClass(ratingClass: string): number {
  const ratingEndIdx = ratingClass.lastIndexOf("-");
  const rt = ratingClass.substring(ratingEndIdx + 1);

  let rating = 0;
  try {
    rating = parseInt(rt) || 0;
  } catch (err) {}

  return rating;
}
