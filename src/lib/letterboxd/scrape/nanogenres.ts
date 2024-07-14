//https://letterboxd.com/film/closer/nanogenres/

import { load, text } from "cheerio";

export async function scrapeNanogenres(name: string) {
  const r = await fetch(`https://letterboxd.com/film/${name}/nanogenres/`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch movie nanogenres", {
      cause: r,
    });
  }

  const body = await r.text();
  const html = load(body);

  const els = html(".title .label");
  const nanogenres = new Array<string>();

  for (const el of els) {
    nanogenres.push(text(el.children));
  }

  return {
    nanogenres,
  };
}
