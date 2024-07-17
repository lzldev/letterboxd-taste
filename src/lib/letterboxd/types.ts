import { PartialFilm } from "../services/film";
import { User } from "../services/user";

export type Network = {
  following: string[];
  followers: string[];
  scraped: boolean;
};

export type WalkedNetwork = {
  following: Connection[];
  followers: Connection[];
};

export type Connection = WalkedUser | UserRef;
export type UserRef = {
  _ref: string;
};

export type WalkedUser = Omit<User, "network"> & {
  network?: WalkedNetwork;
};

export type DiaryEntry = { uri: string; rating: number; liked: boolean };

export type Diary = {
  total: number;
  avgRating: number;
  films: DiaryEntry[];
};

export type FilmEntry = {
  uri: string;
  rating: number | null;
  liked: boolean;
};

export type UserFilmsStats = {
  films: FilmEntry[];
  avgRating: number;
  rated: number;
  liked: number;
  watched: number;
};

export type PartialFilmRecord = Record<string, PartialFilm>;

// number[27]
export type TasteVector = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
