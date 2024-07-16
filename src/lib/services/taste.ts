import type { TasteVector, UserFilmsStats } from "../letterboxd/types";
import type { PartialFilm } from "./film";
import type { GenreAverageMap } from "./genre";

export function calculateUserTaste(
  profile: UserFilmsStats,
  films: Record<string, PartialFilm>,
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
