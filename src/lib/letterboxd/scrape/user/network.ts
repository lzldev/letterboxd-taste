import { load } from "cheerio";
import type { Network } from "../../types";
import { Chunk, Effect, Stream } from "effect";
import {
  NETWORK_MAX_DEPTH,
  NETWORK_USERS_PER_PAGE,
  NETOWORK_FOLLOWER_CONCURRENCY,
} from "~/lib/constants";

export async function scrapeNetwork(
  name: string,
  followingCount: number,
  followerCount: number,
  depth = 1,
) {
  if (depth >= NETWORK_MAX_DEPTH) {
    return {
      followers: [],
      following: [],
      scraped: false,
    } satisfies Network;
  }

  const followingPages = Math.ceil(followingCount / NETWORK_USERS_PER_PAGE);
  const followerPages = Math.ceil(followerCount / NETWORK_USERS_PER_PAGE);

  const [followers, following] = await Effect.all(
    [
      scrapeFollowerPageEffect(name, followerPages, "followers"),
      scrapeFollowerPageEffect(name, followingPages, "following"),
    ],
    {
      concurrency: "unbounded",
    },
  ).pipe(Effect.runPromise);

  return {
    followers: followers,
    following: following,
    scraped: true,
  } satisfies Network;
}

function scrapeFollowerPageEffect(
  name: string,
  pages: number,
  type: "following" | "followers",
) {
  return Stream.range(1, pages).pipe(
    Stream.map((n) => Effect.promise(() => scrapeFollowerPage(name, n, type))),
    Stream.runCollect,
    Effect.runSync,
    Chunk.toArray,
    (pages) =>
      Effect.all(pages, {
        concurrency: NETOWORK_FOLLOWER_CONCURRENCY,
      }),
    Effect.map((pages) => pages.flat()),
  );
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
