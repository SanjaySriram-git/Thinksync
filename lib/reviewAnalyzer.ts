import { ProductReview } from "./types";

/*
 * =========================================================
 * REVIEW ANALYZER
 * =========================================================
 *
 * Purpose:
 * Analyze available product reviews and identify suspicious
 * patterns that may reduce confidence in the overall rating.
 *
 * IMPORTANT:
 * This does NOT prove that a review is fake.
 *
 * It only identifies suspicious patterns such as:
 * - highly duplicated review text
 * - repeated phrases
 * - rating/sentiment mismatch
 * - unusually concentrated ratings
 *
 * A small review count alone is NOT considered suspicious.
 */

/* =========================================================
   TYPES
========================================================= */

export type ReviewAnalysisResult = {
  suspicionScore: number;       // 0 - 100
  confidenceScore: number;      // 0 - 100
  analysis: string;
  signals: string[];
  reviewsAnalyzed: number;
  duplicateReviewRatio: number;
  sentimentMismatchRatio: number;
  ratingConcentration: number;
};

/* =========================================================
   STOP WORDS
========================================================= */

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "is",
  "are",
  "was",
  "were",
  "to",
  "of",
  "for",
  "in",
  "on",
  "with",
  "this",
  "that",
  "it",
  "very",
  "good",
  "product",
  "product.",
  "my",
  "i",
  "me",
  "we",
  "our",
  "you",
  "your",
  "has",
  "have",
  "had",
  "but",
  "so",
  "as",
  "at",
  "be",
  "not",
  "from",
  "they",
  "their",
]);

/* =========================================================
   SENTIMENT WORDS
========================================================= */

const POSITIVE_WORDS = [
  "excellent",
  "amazing",
  "awesome",
  "great",
  "good",
  "best",
  "love",
  "loved",
  "perfect",
  "fantastic",
  "wonderful",
  "super",
  "nice",
  "happy",
  "satisfied",
  "worth",
  "recommend",
  "recommended",
  "quality",
  "smooth",
  "fast",
  "beautiful",
  "useful",
  "comfortable",
  "reliable",
];

const NEGATIVE_WORDS = [
  "bad",
  "poor",
  "worst",
  "hate",
  "hated",
  "terrible",
  "horrible",
  "awful",
  "broken",
  "damage",
  "damaged",
  "defective",
  "slow",
  "waste",
  "useless",
  "disappointed",
  "disappointing",
  "fake",
  "problem",
  "issue",
  "issues",
  "refund",
  "return",
  "cheap",
  "poor",
  "not",
];

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   TOKENIZATION
========================================================= */

function getMeaningfulWords(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter(
      (word) =>
        word.length >= 3 &&
        !STOP_WORDS.has(word)
    );
}

/* =========================================================
   JACCARD SIMILARITY
========================================================= */

function calculateSimilarity(
  first: string,
  second: string
): number {
  const firstWords = new Set(
    getMeaningfulWords(first)
  );

  const secondWords = new Set(
    getMeaningfulWords(second)
  );

  if (
    firstWords.size === 0 ||
    secondWords.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const word of firstWords) {
    if (secondWords.has(word)) {
      intersection++;
    }
  }

  const union = new Set([
    ...firstWords,
    ...secondWords,
  ]).size;

  if (union === 0) return 0;

  return intersection / union;
}

/* =========================================================
   DUPLICATE REVIEW DETECTION
========================================================= */

function calculateDuplicateReviewRatio(
  reviews: ProductReview[]
): number {
  if (reviews.length < 2) {
    return 0;
  }

  let suspiciousPairs = 0;
  let totalPairs = 0;

  for (let i = 0; i < reviews.length; i++) {
    for (let j = i + 1; j < reviews.length; j++) {
      const first = reviews[i].text?.trim();
      const second = reviews[j].text?.trim();

      if (!first || !second) continue;

      totalPairs++;

      const similarity = calculateSimilarity(
        first,
        second
      );

      /*
       * 0.85+ similarity means the reviews are
       * extremely similar.
       */
      if (similarity >= 0.85) {
        suspiciousPairs++;
      }
    }
  }

  if (totalPairs === 0) return 0;

  /*
   * Convert pair ratio into an approximate
   * review-level signal.
   */
  return Math.min(
    1,
    suspiciousPairs / Math.max(1, totalPairs * 0.25)
  );
}

/* =========================================================
   SENTIMENT ANALYSIS
========================================================= */

function calculateSentiment(
  text: string
): number {
  const words = normalizeText(text).split(" ");

  let positive = 0;
  let negative = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) {
      positive++;
    }

    if (NEGATIVE_WORDS.includes(word)) {
      negative++;
    }
  }

  if (positive === 0 && negative === 0) {
    return 0;
  }

  const total = positive + negative;

  return (positive - negative) / total;
}

/* =========================================================
   RATING / SENTIMENT MISMATCH
========================================================= */

function calculateSentimentMismatchRatio(
  reviews: ProductReview[]
): number {
  if (reviews.length === 0) {
    return 0;
  }

  let mismatches = 0;
  let analyzed = 0;

  for (const review of reviews) {
    if (!review.text?.trim()) continue;

    const sentiment = calculateSentiment(
      review.text
    );

    /*
     * Ignore reviews where sentiment
     * cannot be determined.
     */
    if (sentiment === 0) continue;

    analyzed++;

    /*
     * High rating + strongly negative sentiment.
     */
    if (
      review.rating >= 4 &&
      sentiment <= -0.35
    ) {
      mismatches++;
      continue;
    }

    /*
     * Low rating + strongly positive sentiment.
     */
    if (
      review.rating <= 2 &&
      sentiment >= 0.35
    ) {
      mismatches++;
    }
  }

  if (analyzed === 0) {
    return 0;
  }

  return mismatches / analyzed;
}

/* =========================================================
   RATING CONCENTRATION
========================================================= */

function calculateRatingConcentration(
  reviews: ProductReview[]
): number {
  if (reviews.length < 3) {
    return 0;
  }

  const ratingCounts = new Map<
    number,
    number
  >();

  for (const review of reviews) {
    const rating = Math.round(review.rating);

    ratingCounts.set(
      rating,
      (ratingCounts.get(rating) || 0) + 1
    );
  }

  let highestCount = 0;

  for (const count of ratingCounts.values()) {
    highestCount = Math.max(
      highestCount,
      count
    );
  }

  /*
   * Percentage of reviews belonging to the
   * most common rating.
   */
  return highestCount / reviews.length;
}

/* =========================================================
   REVIEW ANALYZER
========================================================= */

export function analyzeReviews(
  reviews: ProductReview[] | undefined,
  reviewCount: number | null,
  rating: number | null
): ReviewAnalysisResult {
  /*
   * No review-level information available.
   */
  if (!reviews || reviews.length === 0) {
    return {
      suspicionScore: 0,
      confidenceScore: 50,
      analysis:
        "Individual review data was not available, so suspicious-review analysis could not be performed.",
      signals: [
        "No individual review text available",
      ],
      reviewsAnalyzed: 0,
      duplicateReviewRatio: 0,
      sentimentMismatchRatio: 0,
      ratingConcentration: 0,
    };
  }

  const validReviews = reviews.filter(
    (review) =>
      typeof review.rating === "number" &&
      review.rating >= 1 &&
      review.rating <= 5
  );

  if (validReviews.length === 0) {
    return {
      suspicionScore: 0,
      confidenceScore: 50,
      analysis:
        "Review data was available, but there were not enough valid reviews to perform the analysis.",
      signals: [
        "Insufficient valid review data",
      ],
      reviewsAnalyzed: 0,
      duplicateReviewRatio: 0,
      sentimentMismatchRatio: 0,
      ratingConcentration: 0,
    };
  }

  /* -------------------------------------------------------
     SIGNAL 1: DUPLICATE REVIEWS
  ------------------------------------------------------- */

  const duplicateReviewRatio =
    calculateDuplicateReviewRatio(
      validReviews
    );

  /* -------------------------------------------------------
     SIGNAL 2: SENTIMENT MISMATCH
  ------------------------------------------------------- */

  const sentimentMismatchRatio =
    calculateSentimentMismatchRatio(
      validReviews
    );

  /* -------------------------------------------------------
     SIGNAL 3: RATING CONCENTRATION
  ------------------------------------------------------- */

  const ratingConcentration =
    calculateRatingConcentration(
      validReviews
    );

  /* -------------------------------------------------------
     SUSPICION SCORE
  ------------------------------------------------------- */

  let suspicionScore = 0;

  const signals: string[] = [];

  /*
   * Duplicate reviews are the strongest signal.
   */
  if (duplicateReviewRatio > 0.5) {
    suspicionScore += 40;

    signals.push(
      "Many reviews contain highly similar wording."
    );
  } else if (duplicateReviewRatio > 0.25) {
    suspicionScore += 25;

    signals.push(
      "Some reviews contain similar wording."
    );
  } else if (duplicateReviewRatio > 0.1) {
    suspicionScore += 10;

    signals.push(
      "A small amount of repeated review wording was detected."
    );
  }

  /*
   * Sentiment/rating mismatch.
   */
  if (sentimentMismatchRatio > 0.4) {
    suspicionScore += 30;

    signals.push(
      "Several review ratings do not match the sentiment of their text."
    );
  } else if (sentimentMismatchRatio > 0.2) {
    suspicionScore += 18;

    signals.push(
      "Some review ratings do not match their text sentiment."
    );
  } else if (sentimentMismatchRatio > 0.1) {
    suspicionScore += 8;

    signals.push(
      "A few rating/sentiment mismatches were detected."
    );
  }

  /*
   * Rating concentration.
   *
   * IMPORTANT:
   * Concentration alone does NOT mean fake reviews.
   */
  if (
    validReviews.length >= 10 &&
    ratingConcentration >= 0.9
  ) {
    suspicionScore += 15;

    signals.push(
      "The available reviews are unusually concentrated around one rating."
    );
  } else if (
    validReviews.length >= 10 &&
    ratingConcentration >= 0.8
  ) {
    suspicionScore += 7;

    signals.push(
      "The rating distribution is strongly concentrated."
    );
  }

  /*
   * Keep the score within 0–100.
   */
  suspicionScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(suspicionScore)
    )
  );

  /* -------------------------------------------------------
     CONFIDENCE SCORE
  ------------------------------------------------------- */

  let confidenceScore =
    100 - suspicionScore;

  /*
   * We should not claim extremely high confidence
   * from only a tiny number of analyzed reviews.
   *
   * This DOES NOT increase suspicion.
   * It only limits confidence in the analysis.
   */
  if (validReviews.length < 5) {
    confidenceScore = Math.min(
      confidenceScore,
      60
    );
  } else if (validReviews.length < 10) {
    confidenceScore = Math.min(
      confidenceScore,
      70
    );
  } else if (validReviews.length < 25) {
    confidenceScore = Math.min(
      confidenceScore,
      85
    );
  }

  /*
   * If the source reports a much larger review count
   * than the reviews we actually analyzed, mention that
   * the analysis is based on a sample.
   */
  if (
    reviewCount !== null &&
    reviewCount > validReviews.length * 3
  ) {
    signals.push(
      `Analysis is based on ${validReviews.length} available reviews out of approximately ${reviewCount}.`
    );

    confidenceScore = Math.min(
      confidenceScore,
      80
    );
  }

  confidenceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(confidenceScore)
    )
  );

  /* -------------------------------------------------------
     OVERALL ANALYSIS
  ------------------------------------------------------- */

  let analysis: string;

  if (suspicionScore <= 20) {
    analysis =
      "No strong suspicious review patterns were detected in the available review data.";
  } else if (suspicionScore <= 40) {
    analysis =
      "Some minor suspicious review patterns were detected, but there is not enough evidence to consider the reviews highly suspicious.";
  } else if (suspicionScore <= 60) {
    analysis =
      "Moderate suspicious patterns were detected. The product rating should be interpreted with some caution.";
  } else if (suspicionScore <= 80) {
    analysis =
      "Several suspicious review patterns were detected. The product rating should be treated cautiously.";
  } else {
    analysis =
      "Strong suspicious patterns were detected in the available review data. The product rating should not be relied upon without additional evidence.";
  }

  /*
   * If there were no specific signals, make that explicit.
   */
  if (signals.length === 0) {
    signals.push(
      "No significant suspicious patterns detected."
    );
  }

  return {
    suspicionScore,
    confidenceScore,
    analysis,
    signals,
    reviewsAnalyzed: validReviews.length,
    duplicateReviewRatio:
      Number(
        duplicateReviewRatio.toFixed(3)
      ),
    sentimentMismatchRatio:
      Number(
        sentimentMismatchRatio.toFixed(3)
      ),
    ratingConcentration:
      Number(
        ratingConcentration.toFixed(3)
      ),
  };
}

/* =========================================================
   PRODUCT-LEVEL HELPER
========================================================= */

export function analyzeProductReviews(
  product: {
    reviews?: ProductReview[];
    reviewCount: number | null;
    rating: number | null;
  }
): ReviewAnalysisResult {
  return analyzeReviews(
    product.reviews,
    product.reviewCount,
    product.rating
  );
}