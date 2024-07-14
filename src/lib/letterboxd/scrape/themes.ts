import { load, text } from "cheerio";

export async function scrapeThemes(name: string) {
  const r = await fetch(`https://letterboxd.com/film/${name}/themes/`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch movie themes", {
      cause: r,
    });
  }

  const body = await r.text();
  const html = load(body);

  const els = html(".title .label");
  const themes = new Array<string>();

  for (const el of els) {
    themes.push(text(el.children));
  }

  return {
    themes,
  };
}
