import { db } from "~/server/db";
import { scrapeUserProfile } from "../letterboxd/scrape/user/profile";
import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { scrapeUserFilms } from "../letterboxd/scrape/user/films";
import { scrapeNetwork } from "../letterboxd/scrape/user/network";

const DAY_IN_MS = 86400000;

export type User = Awaited<ReturnType<typeof getOrScrapeUser>>;

export async function getOrScrapeUser(username: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      username: true,
      displayName: true,
      updatedAt: true,
      filmStats: true,
      network: true,
    },
  });
  if (!user || new Date().getTime() - user.updatedAt.getTime() > DAY_IN_MS) {
    return await upsertUser(username);
  }

  return user;
}

export async function upsertUser(username: string) {
  const profile = await scrapeUserProfile(username);
  const films = await scrapeUserFilms(username, profile.films);
  const network = await scrapeNetwork(
    username,
    profile.following,
    profile.followers,
  );

  const insert = {
    displayName: profile.displayName,
    username: profile.username,
    network: network,
    filmStats: films,
  } satisfies typeof users.$inferInsert;

  const user = await db
    .insert(users)
    .values(insert)
    .onConflictDoUpdate({
      target: users.username,
      set: insert,
    })
    .returning();

  return user.at(0)!;
}

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

export async function walkUserNetwork(
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

    const user = await getOrScrapeUser(follower);
    network.followers.push(...(await walkUserNetwork(user, state, depth + 1)));
  }

  for (const follow of node.network.following) {
    if (state.userSet.has(follow)) {
      network.following.push({ _ref: follow } satisfies UserRef);
      continue;
    }

    const user = await getOrScrapeUser(follow);
    network.following.push(...(await walkUserNetwork(user, state, depth + 1)));
  }

  return [{ ...node, network }];
}
