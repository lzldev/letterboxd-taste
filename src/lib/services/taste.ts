import { db } from "~/server/db";
import type {
  GenreAverageMap,
  PartialFilmRecord,
  TasteVector,
  UserFilmsStats,
  WalkedUser,
} from "../letterboxd/types";
import { users } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { Effect } from "effect";

export function classifyUserTaste(
  profile: UserFilmsStats,
  films: PartialFilmRecord,
  map: GenreAverageMap,
): TasteVector {
  for (const entry of profile.films) {
    if (!entry.rating) {
      continue;
    }
    films[entry.uri]?.genres.forEach((g) => {
      map[g]!.n++;
      map[g]!.total += entry.rating!;
    });
  }

  return Array.from(Object.values(map)).map(
    (e) => e.total / (e.n || 1),
  ) as TasteVector;
}

export async function classifyNetworkTaste(
  userNode: WalkedUser,
  films: PartialFilmRecord,
  map: GenreAverageMap,
) {
  const taste = classifyUserTaste(userNode.filmStats, films, { ...map });
  await db
    .update(users)
    .set({ tasteProfile: taste })
    .where(eq(users.id, userNode.id));

  if (!userNode.network) {
    return;
  }

  const effects = userNode.network.followers
    .filter((c) => !("_ref" in c))
    .concat(userNode.network.following.filter((c) => !("_ref" in c)))
    .map((user) =>
      Effect.promise(
        async () => await classifyNetworkTaste(user as WalkedUser, films, map),
      ),
    );

  await Effect.all(effects, {
    concurrency: 20,
  }).pipe(Effect.runPromise);
}

export async function fetchNetworkTaste(username: string, maxDepth: number) {
  return db.execute(sql<{
    name: string;
    id: number;
    distance: number;
    followers: string[];
    following: string[];
  }>`
WITH RECURSIVE
    RootDistance(distance) AS (SELECT ${users.tasteProfile} distance
                               FROM ${users}
                               WHERE name = ${username}),
    SearchGraph(id, name, followers, following, distance, n) AS MATERIALIZED
        (SELECT id,
                name,
                network -> 'followers',
                network -> 'following',
                cosine_distance(taste_profile, (SELECT distance FROM RootDistance)),
                0
         FROM ${users} current
         WHERE name = ${username}
         UNION
         SELECT t.id,
                t.name,
                t.network -> 'followers',
                t.network -> 'following',
                cosine_distance(t.taste_profile, (SELECT distance FROM RootDistance)),
                link.n + 1
         FROM ${users} t,
              SearchGraph link
         WHERE (link.followers ? t.name OR link.following ? t.name)
           AND link.n < ${maxDepth})
SELECT DISTINCT f.name, f.distance, f.followers, f.following
FROM SearchGraph f ORDER BY f.distance;
    `);
}
