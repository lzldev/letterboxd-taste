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
  avgRating: number;
  rated: number;
  liked: number;
  watched: number;
};

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
