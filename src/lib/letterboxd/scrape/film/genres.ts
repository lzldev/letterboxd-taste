import { load, text } from "cheerio";

export async function scrapeFilmGenres(name: string) {
  const r = await fetch(`https://letterboxd.com/film/${name}/genres/`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch movie genres", {
      cause: r,
    });
  }

  const html = load(await r.text());
  const title = html(".filmtitle span").text();
  const els = html("#tab-genres .text-slug");
  const genres = new Array<string>();

  for (const el of els) {
    const ref = el.attribs.href ?? "";

    if (!ref.startsWith("/films/genre")) {
      continue;
    }

    genres.push(text(el.children));
  }

  return {
    title,
    genres,
  };
}
