import { db } from "~/server/db";
import { sql } from "drizzle-orm";
import { users } from "~/server/db/schema";

import { ScrapeUser, type User } from "./user";
import { Effect } from "effect";
import { WalkedUser, WalkedNetwork, UserRef } from "../letterboxd/types";

const MAX_DEPTH = 1;

export async function WalkUserNetwork(
  node: User,
  state: { userSet: Set<string>; films: Set<string> },
  maxDepth: number,
  depth = 0,
): Promise<WalkedUser[]> {
  state.userSet.add(node.username);
  if (depth >= MAX_DEPTH) {
    const n = node as unknown as WalkedUser;
    delete n.network;
    return [n];
  }

  const network: WalkedNetwork = {
    followers: [],
    following: [],
  };

  const followerEffects = node.network.followers.map((name) =>
    Effect.tryPromise({
      try: async () => {
        if (state.userSet.has(name)) {
          network.followers.push({ _ref: name } satisfies UserRef);
          return;
        }

        const user = await ScrapeUser(name);
        state.films = new Set(
          user.filmStats.films
            .map((f) => f.uri)
            .concat(...state.films.values()),
        );
        network.followers.push(
          ...(await WalkUserNetwork(user, state, maxDepth, depth + 1)),
        );
      },
      catch(error) {
        console.error(`Failed to fetch ${name} Page`, error);
      },
    }),
  );

  const followingEffects = node.network.following.map((name) =>
    Effect.tryPromise({
      try: async () => {
        if (state.userSet.has(name)) {
          network.following.push({ _ref: name } satisfies UserRef);
          return;
        }

        const user = await ScrapeUser(name);
        state.films = new Set(
          user.filmStats.films
            .map((f) => f.uri)
            .concat(...state.films.values()),
        );
        network.following.push(
          ...(await WalkUserNetwork(user, state, maxDepth, depth + 1)),
        );
      },
      catch(error) {
        console.error(`Failed to fetch ${name} Page`, error);
      },
    }),
  );

  await Effect.all([...followerEffects, ...followingEffects], {
    concurrency: 5,
  }).pipe(Effect.runPromise);

  return [{ ...node, network }];
}

export async function UserNetworkFlatGraph(username: string) {
  const sq = sql<{
    name: string;
    followers: string[];
    following: string[];
  }>`WITH RECURSIVE SearchGraph(name, followers, following, n) AS MATERIALIZED
                     (SELECT name, network -> 'followers', network -> 'following', 0
                      FROM ${users} current
                      WHERE name = ${username}
                      UNION DISTINCT SELECT t.name, t.network -> 'followers', t.network -> 'following', link.n + 1
                      FROM ${users} t,
                           SearchGraph link
                      WHERE (link.followers ? t.name OR link.following ? t.name)
                        AND link.n < 2)
  SELECT DISTINCT f.name, f.followers, f.following
  FROM SearchGraph F;`;

  return await db.execute(sq);
}

export async function UserNetworkFlatMapGraph(username: string) {
  const sq = sql`WITH RECURSIVE SearchGraph(name, followers, following, n) AS MATERIALIZED
                     (SELECT name, network -> 'followers', network -> 'following', 0
                      FROM ${users} current
                      WHERE name = ${username}
                      UNION DISTINCT SELECT t.name, t.network -> 'followers', t.network -> 'following', link.n + 1
                      FROM ${users} t,
                           SearchGraph link
                      WHERE (link.followers ? t.name OR link.following ? t.name)
                        AND link.n < 2)
  SELECT DISTINCT jsonb_object_agg(F.name,jsonb_build_object('name',F.name,'followers', F.followers, 'following',F.following)) as graph
  FROM SearchGraph F;`;

  return await db.execute<{
    graph: Record<
      string,
      {
        name: string;
        followers: string[];
        following: string[];
      }
    >;
  }>(sq);
}
