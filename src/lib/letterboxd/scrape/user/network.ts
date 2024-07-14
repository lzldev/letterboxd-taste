import { load, text } from "cheerio";

export async function scrapeNetwork(
  name: string,
  followingCount: number,
  followerCount: number,
) {
  const followingPages = Math.ceil(followingCount / 25);
  const followerPages = Math.ceil(followerCount / 25);

  const p1 = Promise.all(
    new Array(followerPages)
      .fill(null)
      .map((_, i) => scrapeFollowerPage(name, i + 1, "followers")),
  );

  const p2 = Promise.all(
    new Array(followingPages)
      .fill(null)
      .map((_, i) => scrapeFollowerPage(name, i + 1, "following")),
  );

  const [followers, following] = await Promise.all([p1, p2]);

  return {
    followers: followers.flat(),
    following: following.flat(),
  };
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
