// Shared shapes for the data the API hands to the screens.
export type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

export type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  ratingCounts: { rating: number; count: number }[];
  latestReview: Review | null;
  reviews: Review[]; // every review EXCEPT the latest (API already handled that)
};
