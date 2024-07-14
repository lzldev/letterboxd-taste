import { load } from "cheerio";
import type { Network } from "../../types";

export async function scrapeNetwork(
  name: string,
  followingCount: number,
  followerCount: number,
) {
  const followingPages = Math.ceil(followingCount / 25);
  const followerPages = Math.ceil(followerCount / 25);

  const [followers, following] = await Promise.all([
    Promise.all(
      new Array(followerPages)
        .fill(null)
        .map((_, i) => scrapeFollowerPage(name, i + 1, "followers")),
    ),
    Promise.all(
      new Array(followingPages)
        .fill(null)
        .map((_, i) => scrapeFollowerPage(name, i + 1, "following")),
    ),
  ]);

  return {
    followers: followers.flat(),
    following: following.flat(),
  } satisfies Network;
}

async function scrapeFollowerPage(
  name: string,
  page: number,
  type: "following" | "followers",
) {
  const r = await fetch(`https://letterboxd.com/${name}/${type}/page/${page}`);

  if (r.status !== 200) {
    throw new Error("Couldn't fetch user profile", {
      cause: r,
    });
  }

  const html = load(await r.text());
  const links = html(".person-summary .title-3 a");

  const users: string[] = [];
  for (const user of links) {
    users.push(user.attribs.href!.slice(1, -1));
  }

  return users;
}
