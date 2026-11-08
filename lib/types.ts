export type ProductReview = {
  rating: number;
  text: string;
  date?: string | null;
};

export type ScrapedProduct = {
  id: string;

  source:
    | "amazon"
    | "flipkart"
    | "myntra"
    | "snapdeal"
    | "tatacliq"
    | "ajio"
    | "nykaa";

  name: string;

  brand?: string | null;

  price: number;

  originalPrice?: number | null;

  discount?: number | null;

  currency: string;

  rating: number | null;

  reviewCount: number | null;

  // Individual reviews when the scraper can collect them.
  reviews?: ProductReview[];

  url: string;

  image: string | null;
};

export type Requirements = {
  category: string | null;

  productType: string | null;

  brand?: string | null;

  budget: {
    min: number | null;
    max: number | null;
  };

  purpose: string | null;

  preferences: string[];

  searchTerms: string;

  originalQuery?: string;
};

export type RankedProduct = ScrapedProduct & {
  match: number;

  reason: string;

  matchedPreferences?: string[];

  budgetMatch?: boolean;

  ratingScore?: number;

  preferenceScore?: number;

  // Review-analysis results
  reviewSuspicionScore?: number;

  reviewConfidenceScore?: number;

  reviewAnalysis?: string;
};