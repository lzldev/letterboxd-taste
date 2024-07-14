import { type AnyNode, text } from "cheerio";

export function parseIntFromCheerioEl(el: ArrayLike<AnyNode>): number {
  let n = 0;
  try {
    n = parseInt(text(el)) || 0;
  } catch (err) {}
  return n;
}
