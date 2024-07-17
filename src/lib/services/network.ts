import { db } from "~/server/db";
import { sql } from "drizzle-orm";
import { users } from "~/server/db/schema";

import { ScrapeUser, type User } from "./user";

type WalkedNetwork = {
  following: Connection[];
  followers: Connection[];
};

type Connection = WalkedUser | UserRef;
type UserRef = {
  _ref: string;
};

type WalkedUser = Omit<User, "network"> & {
  network?: WalkedNetwork;
};

const MAX_DEPTH = 1;

export async function WalkUserNetwork(
  node: User,
  state: { userSet: Set<string> },
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

  for (const follower of node.network.followers) {
    if (state.userSet.has(follower)) {
      network.followers.push({ _ref: follower } satisfies UserRef);
      continue;
    }

    const user = await ScrapeUser(follower);
    network.followers.push(...(await WalkUserNetwork(user, state, depth + 1)));
  }

  for (const follow of node.network.following) {
    if (state.userSet.has(follow)) {
      network.following.push({ _ref: follow } satisfies UserRef);
      continue;
    }

    const user = await ScrapeUser(follow);
    network.following.push(...(await WalkUserNetwork(user, state, depth + 1)));
  }

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
