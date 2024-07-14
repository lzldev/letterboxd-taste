export type Network = {
  following: string[];
  followers: string[];
};

export type DiaryRating = { filmName: string; rating: number };

export type Diary = {
  total: number;
  avgRating: number;
  films: DiaryRating[];
};
