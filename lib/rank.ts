import {
  RankedProduct,
  Requirements,
  ScrapedProduct,
} from "./types";

import {
  analyzeProductReviews,
} from "./reviewAnalyzer";

/*
 * ---------------------------------------------------------
 * WHOLE-WORD MATCHING
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * Plain `string.includes()` caused wrong products to pass:
 *
 *   "headphone".includes("phone")  -> true   (WRONG)
 *   "portable".includes("table")   -> true   (WRONG)
 *   "standard".includes("stand")   -> true   (WRONG)
 *
 * containsWord() only matches whole words / phrases
 * (with an optional plural "s" / "es"), so:
 *
 *   containsWord("u7 tws headphone", "phone")      -> false
 *   containsWord("realme p4x smartphone", "phone") -> false (use "smartphone")
 *   containsWord("apple iphone 15", "iphone")      -> true
 *   containsWord("best phones", "phone")           -> true
 * ---------------------------------------------------------
 */

const wordRegexCache = new Map<string, RegExp>();

function wordRegex(term: string): RegExp {
  let regex = wordRegexCache.get(term);

  if (!regex) {
    const escaped = term
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");

    regex = new RegExp(
      `(?:^|[^a-z0-9])${escaped}(?:s|es)?(?![a-z0-9])`,
      "i"
    );

    wordRegexCache.set(term, regex);
  }

  return regex;
}

function containsWord(text: string, term: string): boolean {
  return wordRegex(term).test(text);
}

/*
 * ---------------------------------------------------------
 * RELEVANCE GROUPS
 * ---------------------------------------------------------
 */

type RelevanceGroup = {
  /** Words in the USER'S product type that select this group. */
  match: string[];

  /** At least one of these must appear in the product title. */
  keywords: string[];

  /** If any of these appear, the title belongs to another category. */
  exclude?: string[];

  /** Accessory words that are NORMAL for this category
   *  (e.g. earbuds "with Charging Case"). */
  allowAccessoryWords?: string[];

  /** Anything cheaper is almost certainly an accessory / junk listing. */
  minPrice?: number;

  isDevice: boolean;
};

const RELEVANCE_GROUPS: RelevanceGroup[] = [
  {
    match: ["laptop", "notebook"],
    keywords: ["laptop", "notebook", "macbook", "ultrabook"],
    minPrice: 8000,
    isDevice: true,
  },
  {
    match: ["phone", "smartphone", "mobile", "iphone"],
    keywords: ["phone", "smartphone", "mobile", "iphone"],
    exclude: [
      "headphone",
      "earphone",
      "earbud",
      "airpod",
      "tws",
      "neckband",
      "headset",
      "handsfree",
      "hands free",
      "smartwatch",
      "smart watch",
      "laptop",
      "tablet",
      "landline",
      "cordless",
      "corded",
      "telephone",
      "intercom",
      "caller id",
    ],
    minPrice: 1000,
    isDevice: true,
  },
  {
    match: ["tablet", "ipad"],
    keywords: ["tablet", "ipad"],
    minPrice: 2500,
    isDevice: true,
  },
  {
    match: [
      "headphone",
      "earbud",
      "earphone",
      "airpod",
      "tws",
      "neckband",
      "headset",
    ],
    keywords: [
      "headphone",
      "earbud",
      "earphone",
      "airpod",
      "tws",
      "neckband",
      "headset",
    ],
    allowAccessoryWords: ["case", "charger"],
    isDevice: true,
  },
  {
    match: ["smartwatch", "smart watch"],
    keywords: ["smartwatch", "smart watch"],
    isDevice: true,
  },
  {
    match: ["television", "tv"],
    keywords: ["tv", "television"],
    minPrice: 3000,
    isDevice: true,
  },
  {
    match: ["camera"],
    keywords: ["camera", "dslr", "mirrorless"],
    isDevice: true,
  },
  {
    match: ["speaker", "soundbar"],
    keywords: ["speaker", "soundbar"],
    isDevice: true,
  },
  {
    match: ["monitor"],
    keywords: ["monitor"],
    isDevice: true,
  },
  {
    match: ["keyboard"],
    keywords: ["keyboard"],
    isDevice: true,
  },
  {
    match: ["mouse"],
    keywords: ["mouse"],
    isDevice: true,
  },
];

/*
 * For devices with a minPrice, results cheaper than this
 * fraction of the user's MAXIMUM budget are dropped.
 * (0.1 -> with a ₹70,000 budget, nothing under ₹7,000.)
 * Lower it if you want cheaper options to show up.
 */
const MIN_PRICE_FRACTION_OF_BUDGET = 0.1;

const ACCESSORY_BLOCKLIST = [
  "stand",
  "table",
  "tray",
  "sleeve",
  "case",
  "cover",
  "skin",
  "charger",
  "adapter",
  "cooling pad",
  "mount",
  "tripod",
  "strap",
  "screen guard",
  "protector",
  "dust cover",
  "keyboard cover",
  "bag",
  "backpack",
  "power bank",
  "powerbank",
  "cable",
  "holder",
  "stylus",
  "cooler",
  "trigger",
  "gamepad",
  "joystick",
  "popsocket",
  "pop socket",
  "selfie stick",
  "tempered glass",
  "mouse pad",
  "mousepad",
];

/*
 * ---------------------------------------------------------
 * FIND RELEVANCE GROUP
 * ---------------------------------------------------------
 *
 * Uses whole-word matching on the user's product type, so
 * "Headphones" selects the headphone group instead of the
 * phone group.
 * ---------------------------------------------------------
 */

function findRelevanceGroup(
  productType: string | null | undefined
): RelevanceGroup | null {
  if (!productType) return null;

  const lower = productType.toLowerCase();

  return (
    RELEVANCE_GROUPS.find((group) =>
      group.match.some((m) => containsWord(lower, m))
    ) || null
  );
}

/*
 * ---------------------------------------------------------
 * PRODUCT RELEVANCE
 * ---------------------------------------------------------
 */

function isRelevantProduct(
  product: ScrapedProduct,
  requirements: Requirements
): boolean {
  const group = findRelevanceGroup(
    requirements.productType
  );

  // No specific product type known.
  if (!group) return true;

  const name = product.name.toLowerCase();

  // 1. Title must contain a core keyword as a WHOLE word.
  const hasCoreKeyword = group.keywords.some(
    (keyword) => containsWord(name, keyword)
  );

  if (!hasCoreKeyword) {
    return false;
  }

  // 2. Title must not clearly belong to another category
  //    (e.g. a "phone" search must not return earbuds).
  if (
    group.exclude?.some((word) =>
      containsWord(name, word)
    )
  ) {
    return false;
  }

  // 3. Accessories are not the device itself.
  if (group.isDevice) {
    const allowed = group.allowAccessoryWords ?? [];

    const isAccessory = ACCESSORY_BLOCKLIST.some(
      (word) =>
        !allowed.includes(word) &&
        containsWord(name, word)
    );

    if (isAccessory) {
      return false;
    }
  }

  // 4. Implausibly cheap listings are not real devices.
  //    The floor also scales with the user's budget: someone
  //    with a ₹70,000 budget is not looking for a ₹2,000 phone.
  if (group.minPrice !== undefined) {
    const maxBudget = requirements.budget?.max ?? null;

    const floor =
      maxBudget !== null
        ? Math.max(
            group.minPrice,
            maxBudget * MIN_PRICE_FRACTION_OF_BUDGET
          )
        : group.minPrice;

    if (product.price < floor) {
      return false;
    }
  }

  return true;
}

/*
 * ---------------------------------------------------------
 * HARD BUDGET FILTER
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * Budget is a mandatory user requirement.
 *
 * We do NOT allow products above the maximum budget
 * just because they receive a lower score.
 *
 * Example:
 *
 * User: phone under ₹400
 *
 * ₹350    -> allowed
 * ₹400    -> allowed
 * ₹401    -> rejected
 * ₹13,999 -> rejected
 *
 * This prevents the ranking system from recommending
 * products that violate the user's explicit budget.
 * ---------------------------------------------------------
 */

function isWithinBudget(
  product: ScrapedProduct,
  budget: Requirements["budget"]
): boolean {
  if (budget.max !== null && product.price > budget.max) {
    return false;
  }

  if (budget.min !== null && product.price < budget.min) {
    return false;
  }

  return true;
}

/*
 * ---------------------------------------------------------
 * REVIEW ANALYSIS
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * A low review count does NOT mean that reviews are fake.
 *
 * We only penalize products when the review analyzer finds
 * suspicious patterns such as:
 *
 * - highly similar/duplicate review text
 * - rating/sentiment mismatch
 * - unusually concentrated ratings
 *
 * If individual review data is unavailable, the analyzer
 * returns a neutral result and the product is NOT penalized.
 * ---------------------------------------------------------
 */

function applyReviewAnalysis(
  product: ScrapedProduct,
  score: number,
  reasons: string[]
) {
  const reviewResult =
    analyzeProductReviews(product);

  let reviewScoreAdjustment = 0;

  /*
   * HIGH SUSPICION
   */

  if (reviewResult.suspicionScore >= 70) {
    reviewScoreAdjustment = -12;

    reasons.push(
      "review patterns appear highly suspicious"
    );
  }

  /*
   * MODERATE-HIGH SUSPICION
   */

  else if (reviewResult.suspicionScore >= 50) {
    reviewScoreAdjustment = -8;

    reasons.push(
      "review patterns show some suspicious signals"
    );
  }

  /*
   * MODERATE SUSPICION
   */

  else if (reviewResult.suspicionScore >= 30) {
    reviewScoreAdjustment = -4;

    reasons.push(
      "review patterns should be interpreted with caution"
    );
  }

  /*
   * LOW SUSPICION
   */

  else if (
    reviewResult.suspicionScore <= 20 &&
    reviewResult.reviewsAnalyzed >= 5
  ) {
    /*
     * Small positive signal.
     *
     * This does NOT mean the reviews are guaranteed genuine.
     */

    reviewScoreAdjustment = 2;

    reasons.push(
      "no strong suspicious review patterns detected"
    );
  }

  /*
   * APPLY REVIEW ADJUSTMENT
   */

  score += reviewScoreAdjustment;

  return {
    score,
    reviewResult,
    reviewScoreAdjustment,
  };
}

/*
 * ---------------------------------------------------------
 * MAIN PRODUCT RANKING
 * ---------------------------------------------------------
 */

export function rankProducts(
  products: ScrapedProduct[],
  requirements: Requirements
): RankedProduct[] {
  const budget = requirements.budget ?? {
    min: null,
    max: null,
  };

  const preferences = Array.isArray(
    requirements.preferences
  )
    ? requirements.preferences
    : [];

  const requestedBrand =
    requirements.brand?.toLowerCase() || null;

  const requestedProductType =
    requirements.productType?.toLowerCase() || null;

  const requestedTypeGroup = findRelevanceGroup(
    requirements.productType
  );

  /*
   * -------------------------------------------------------
   * FILTER PRODUCTS BEFORE RANKING
   * -------------------------------------------------------
   *
   * Order:
   *
   * 1. Valid price
   * 2. Correct product type
   * 3. HARD budget constraint
   *
   * Only products that satisfy mandatory requirements
   * reach the ranking algorithm.
   * -------------------------------------------------------
   */

  const eligibleProducts = products
    .filter((p) => p.price > 0)
    .filter((p) =>
      isRelevantProduct(p, requirements)
    )
    .filter((p) =>
      isWithinBudget(p, budget)
    );

  const scored = eligibleProducts.map((p) => {
    let score = 50;

    const reasons: string[] = [];

    const productName =
      p.name.toLowerCase();

    const brand =
      (p.brand || "").toLowerCase();

    /*
     * -----------------------------------------------------
     * BUDGET
     * -----------------------------------------------------
     *
     * Because the hard budget filter already ran,
     * every remaining product satisfies the budget.
     * -----------------------------------------------------
     */

    let budgetMatch = true;

    if (budget.max !== null) {
      score += 20;

      reasons.push(
        "within your budget"
      );
    }

    if (budget.min !== null) {
      score += 5;

      reasons.push(
        "meets your minimum budget"
      );
    }

    /*
     * -----------------------------------------------------
     * RATING
     * -----------------------------------------------------
     */

    let ratingScore = 0;

    if (p.rating !== null) {
      ratingScore = Math.max(
        0,
        (p.rating - 3) * 8
      );

      score += ratingScore;

      if (p.rating >= 4.3) {
        reasons.push(
          "highly rated"
        );
      }

      else if (p.rating >= 4) {
        reasons.push(
          "good customer rating"
        );
      }
    }

    /*
     * -----------------------------------------------------
     * REVIEW ANALYSIS
     * -----------------------------------------------------
     */

    const reviewEvaluation =
      applyReviewAnalysis(
        p,
        score,
        reasons
      );

    score =
      reviewEvaluation.score;

    const reviewResult =
      reviewEvaluation.reviewResult;

    /*
     * -----------------------------------------------------
     * PREFERENCES
     * -----------------------------------------------------
     */

    const matchedPreferences =
      preferences.filter((pref) =>
        productName.includes(
          pref.toLowerCase()
        )
      );

    const preferenceScore =
      matchedPreferences.length * 5;

    score += preferenceScore;

    if (
      matchedPreferences.length > 0
    ) {
      reasons.push(
        `matches ${matchedPreferences.join(
          ", "
        )} preference`
      );
    }

    /*
     * -----------------------------------------------------
     * BRAND (whole-word match)
     * -----------------------------------------------------
     */

    if (
      requestedBrand &&
      (
        containsWord(brand, requestedBrand) ||
        containsWord(productName, requestedBrand)
      )
    ) {
      score += 12;

      reasons.push(
        `matches your ${requirements.brand} brand preference`
      );
    }

    /*
     * -----------------------------------------------------
     * PRODUCT TYPE
     * -----------------------------------------------------
     *
     * If the type maps to a relevance group, the product
     * already passed isRelevantProduct(), so it matches.
     * Otherwise fall back to a whole-word title match.
     * -----------------------------------------------------
     */

    const productTypeMatched = requestedTypeGroup
      ? true
      : requestedProductType !== null &&
        (
          containsWord(
            productName,
            requestedProductType
          ) ||
          containsWord(
            productName,
            normalizeProductType(
              requestedProductType
            )
          )
        );

    if (productTypeMatched && requestedProductType) {
      score += 10;

      reasons.push(
        `matches ${requirements.productType}`
      );
    }

    /*
     * -----------------------------------------------------
     * DISCOUNT
     * -----------------------------------------------------
     */

    if (
      p.originalPrice &&
      p.originalPrice > p.price
    ) {
      const discountPercent =
        (
          (p.originalPrice - p.price) /
          p.originalPrice
        ) * 100;

      if (
        discountPercent >= 20
      ) {
        score += 5;

        reasons.push(
          "good discount"
        );
      }
    }

    /*
     * -----------------------------------------------------
     * BUDGET UTILIZATION
     * -----------------------------------------------------
     *
     * The old tiebreaker rewarded CHEAP products, so with a
     * ₹70,000 budget a ₹23,000 phone beat a ₹60,000 one.
     *
     * When the user gives a maximum budget, products priced
     * closer to it are more likely to be what they expect
     * (e.g. a gaming phone), so we reward price relative to
     * the budget instead (0 – 12 points).
     *
     * With no maximum budget, keep a small preference for
     * lower prices.
     * -----------------------------------------------------
     */

    if (budget.max !== null && budget.max > 0) {
      const budgetRatio = Math.min(
        1,
        p.price / budget.max
      );

      score += budgetRatio * 12;

      if (budgetRatio >= 0.6) {
        reasons.push(
          "makes good use of your budget"
        );
      }
    } else {
      score += Math.max(
        0,
        Math.min(
          5,
          5 - p.price / 20000
        )
      );
    }

    /*
     * -----------------------------------------------------
     * FINAL SCORE
     * -----------------------------------------------------
     */

    const match = Math.max(
      0,
      Math.min(
        99,
        Math.round(score)
      )
    );

    /*
     * -----------------------------------------------------
     * REVIEW EXPLANATION
     * -----------------------------------------------------
     */

    let reviewAnalysis =
      reviewResult.analysis;

    /*
     * If no individual reviews were available,
     * explicitly say so instead of implying that
     * the product has suspicious reviews.
     */

    if (
      reviewResult.reviewsAnalyzed === 0
    ) {
      reviewAnalysis =
        "Individual review data was not available for detailed suspicious-review analysis.";
    }

    return {
      ...p,

      match,

      reason:
        reasons.length > 0
          ? reasons.join("; ")
          : "Good overall option for your search.",

      matchedPreferences,

      budgetMatch,

      ratingScore,

      preferenceScore,

      /*
       * REVIEW ANALYSIS RESULTS
       */

      reviewSuspicionScore:
        reviewResult.suspicionScore,

      reviewConfidenceScore:
        reviewResult.confidenceScore,

      reviewAnalysis,
    };
  });

  /*
   * ---------------------------------------------------------
   * SORT
   * ---------------------------------------------------------
   */

  return scored
    .sort((a, b) => {
      /*
       * Primary:
       * highest overall match.
       */

      if (b.match !== a.match) {
        return b.match - a.match;
      }

      /*
       * Secondary:
       * lower suspicious-review score wins
       * when two products have the same match.
       */

      return (
        a.reviewSuspicionScore -
        b.reviewSuspicionScore
      );
    })
    .slice(0, 20);
}

/*
 * ---------------------------------------------------------
 * PRODUCT TYPE NORMALIZATION
 * ---------------------------------------------------------
 *
 * Only used as a fallback for product types that have no
 * relevance group.
 *
 * "Smartphone" -> "phone"
 * "Mobile Phone" -> "phone"
 * "Television" -> "tv"
 * ---------------------------------------------------------
 */

function normalizeProductType(
  productType: string
): string {
  const type = productType.toLowerCase();

  if (
    type.includes("smartphone") ||
    type.includes("mobile phone")
  ) {
    return "phone";
  }

  if (
    type === "television" ||
    type.includes("television")
  ) {
    return "tv";
  }

  if (
    type.includes("notebook")
  ) {
    return "laptop";
  }

  if (
    type.includes("smart watch")
  ) {
    return "smartwatch";
  }

  if (
    type.includes("earphone")
  ) {
    return "earphone";
  }

  return type;
}