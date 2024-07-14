export type Network = {
  following: string[];
  followers: string[];
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
  avg: number;
  rated: number;
  watched: number;
};
