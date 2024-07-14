import { load, text } from "cheerio";

export async function scrapeGenres(name: string) {
  const r = await fetch(`https://letterboxd.com/film/${name}/genres/`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch movie genres", {
      cause: r,
    });
  }

  const html = load(await r.text());
  const els = html(".text-slug", "#tab-genres");
  const genres = new Array<string>();

  for (const el of els) {
    const t = text(el.children);
    const ref = el.attribs.href ?? "";

    if (!ref.startsWith("/films/genre")) {
      continue;
    }

    genres.push(t);
  }

  return {
    genres,
  };
}
