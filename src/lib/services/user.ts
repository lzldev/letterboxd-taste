import { db } from "~/server/db";
import { scrapeUserProfile } from "../letterboxd/scrape/user/profile";
import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { scrapeNetwork } from "../letterboxd/scrape/user/network";
import { DAY_IN_MS } from "../constants";

export type User = Awaited<ReturnType<typeof ScrapeUser>>;

export async function ScrapeUser(username: string) {
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
    return await UpdateUser(username);
  }

  return user;
}

export async function UpdateUser(username: string) {
  const profile = await scrapeUserProfile(username);
  // const films = await scrapeCategoryFilms(username, profile.films);
  const network = await scrapeNetwork(
    username,
    profile.following,
    profile.followers,
  );

  const insert = {
    displayName: profile.displayName,
    username: profile.username,
    network: network,
    // filmStats: films,
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
