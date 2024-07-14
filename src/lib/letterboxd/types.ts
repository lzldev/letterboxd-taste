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
