import { db } from "~/server/db";
import { scrapeUserProfile } from "../letterboxd/scrape/user/profile";
import { eq } from "drizzle-orm";
import { users } from "~/server/db/schema";
import { scrapeUserFilms } from "../letterboxd/scrape/user/films";
import { scrapeNetwork } from "../letterboxd/scrape/user/network";

const DAY_IN_MS = 86400000;

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
