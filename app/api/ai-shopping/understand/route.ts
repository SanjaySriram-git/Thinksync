import { NextResponse } from "next/server";
import { Requirements } from "@/lib/types";

/* =========================================================
   CATEGORY → PRODUCT TYPES
   ========================================================= */

const PRODUCT_CATEGORIES: Record<string, string[]> = {
  Electronics: [
    "smartphone",
    "phone",
    "mobile",
    "laptop",
    "notebook",
    "tablet",
    "ipad",
    "headphones",
    "earbuds",
    "earphones",
    "smartwatch",
    "watch",
    "camera",
    "dslr",
    "mirrorless",
    "television",
    "tv",
    "monitor",
    "keyboard",
    "mouse",
    "speaker",
    "soundbar",
    "projector",
  ],

  Appliances: [
    "refrigerator",
    "fridge",
    "washing machine",
    "air conditioner",
    "ac",
    "microwave",
    "oven",
    "air fryer",
    "mixer",
    "mixer grinder",
    "grinder",
    "vacuum cleaner",
    "water purifier",
    "geyser",
    "iron",
    "fan",
    "cooler",
    "heater",
    "coffee maker",
    "kettle",
    "toaster",
  ],

  Fashion: [
    "shirt",
    "tshirt",
    "t-shirt",
    "jeans",
    "trousers",
    "pants",
    "dress",
    "kurti",
    "saree",
    "jacket",
    "hoodie",
    "sweater",
    "shorts",
    "skirt",
    "top",
    "clothing",
    "clothes",
    "shoes",
    "sneakers",
    "sandals",
    "slippers",
    "heels",
    "watch",
    "bag",
    "handbag",
    "backpack",
    "wallet",
  ],

  Beauty: [
    "makeup",
    "lipstick",
    "foundation",
    "mascara",
    "eyeliner",
    "perfume",
    "fragrance",
    "skincare",
    "face wash",
    "moisturizer",
    "serum",
    "shampoo",
    "conditioner",
    "sunscreen",
  ],

  Home: [
    "sofa",
    "chair",
    "table",
    "bed",
    "mattress",
    "curtain",
    "carpet",
    "rug",
    "lamp",
    "furniture",
    "decor",
    "home decor",
  ],

  Sports: [
    "football",
    "cricket",
    "cricket bat",
    "cricket ball",
    "badminton",
    "tennis",
    "basketball",
    "gym",
    "gym equipment",
    "running shoes",
    "sports shoes",
    "sportswear",
  ],

  "Books & Education": [
    "book",
    "textbook",
    "novel",
    "notebook",
    "calculator",
    "stationery",
    "study table",
  ],
};

/* =========================================================
   PRODUCT TYPE → SEARCH TERMS
   ========================================================= */

const PRODUCT_TYPE_ALIASES: Record<string, string[]> = {
  Smartphone: [
    "phone",
    "smartphone",
    "mobile",
    "android phone",
    "iphone",
    "foldable phone",
    "foldable",
  ],

  Laptop: [
    "laptop",
    "notebook",
    "macbook",
    "ultrabook",
    "gaming laptop",
  ],

  Tablet: [
    "tablet",
    "ipad",
    "android tablet",
  ],

  Headphones: [
    "headphone",
    "headphones",
    "earbuds",
    "earphones",
    "airpods",
  ],

  Smartwatch: [
    "smartwatch",
    "smart watch",
  ],

  Television: [
    "tv",
    "television",
    "smart tv",
  ],

  Camera: [
    "camera",
    "dslr",
    "mirrorless",
  ],

  Shoes: [
    "shoes",
    "sneakers",
    "footwear",
    "running shoes",
    "sports shoes",
  ],

  Clothing: [
    "clothing",
    "clothes",
    "shirt",
    "tshirt",
    "t-shirt",
    "jeans",
    "dress",
    "kurti",
    "saree",
    "jacket",
    "hoodie",
    "trousers",
    "pants",
  ],

  Beauty: [
    "makeup",
    "cosmetics",
    "skincare",
    "beauty",
    "lipstick",
    "foundation",
    "perfume",
    "serum",
  ],

  "Kitchen Appliance": [
    "air fryer",
    "mixer",
    "mixer grinder",
    "grinder",
    "microwave",
    "oven",
    "kettle",
    "toaster",
    "coffee maker",
  ],

  Refrigerator: [
    "refrigerator",
    "fridge",
  ],

  "Washing Machine": [
    "washing machine",
    "washer",
  ],

  "Air Conditioner": [
    "air conditioner",
    "ac",
    "split ac",
    "window ac",
  ],
};

/* =========================================================
   PURPOSE
   ========================================================= */

const PURPOSE_KEYWORDS: Record<string, string[]> = {
  coding: [
    "coding",
    "programming",
    "developer",
    "development",
    "software",
    "computer science",
    "coding laptop",
  ],

  gaming: [
    "gaming",
    "game",
    "games",
    "gamer",
    "fps",
    "esports",
  ],

  "creative work": [
    "editing",
    "video editing",
    "photo editing",
    "photoshop",
    "premiere",
    "design",
    "graphic design",
    "creator",
    "content creation",
  ],

  fitness: [
    "gym",
    "workout",
    "fitness",
    "running",
    "exercise",
  ],

  travel: [
    "travel",
    "travelling",
    "trip",
    "vacation",
  ],

  office: [
    "office",
    "work",
    "work from home",
    "business",
    "professional",
  ],

  student: [
    "student",
    "college",
    "university",
    "study",
    "studies",
  ],

  gift: [
    "gift",
    "present",
    "birthday",
    "anniversary",
  ],

  party: [
    "party",
    "function",
    "wedding",
    "event",
  ],

  general: [
    "everyday",
    "daily use",
    "general use",
    "browsing",
  ],
};

/* =========================================================
   PREFERENCES
   ========================================================= */

const PREFERENCE_KEYWORDS = [
  "lightweight",
  "light weight",
  "long battery life",
  "good battery",
  "fast",
  "durable",
  "premium",
  "compact",
  "portable",
  "good camera",
  "large storage",
  "more storage",
  "waterproof",
  "water resistant",
  "cheap",
  "affordable",
  "value for money",
  "best camera",
  "best battery",
];

/* =========================================================
   COMMON BRANDS
   ========================================================= */

const BRANDS = [
  "samsung",
  "apple",
  "iphone",
  "oneplus",
  "xiaomi",
  "redmi",
  "realme",
  "oppo",
  "vivo",
  "motorola",
  "google",
  "pixel",
  "nothing",
  "iqoo",
  "poco",

  "hp",
  "dell",
  "lenovo",
  "asus",
  "acer",
  "msi",
  "microsoft",

  "sony",
  "boat",
  "jbl",
  "bose",
  "sennheiser",

  "canon",
  "nikon",
  "fujifilm",

  "lg",
  "whirlpool",
  "haier",
  "voltas",
  "daikin",
  "panasonic",

  "nike",
  "adidas",
  "puma",
  "reebok",
  "skechers",

  "maybelline",
  "lakme",
  "loreal",
  "mac",
  "nykaa",
];

/*
 * When a brand is detected but no product type/category keyword was
 * found in the query at all (e.g. "Samsung under 30000"), fall back to
 * that brand's most common product category. Without this, a bare
 * brand name gets sent straight to the scrapers as the whole search
 * query, and something like "Samsung" mostly returns chargers, cables
 * and cases rather than phones. This is a best-effort default, not a
 * guarantee — brands like Samsung/LG/Panasonic do sell many categories
 * of product, but skew heavily toward the one listed here when paired
 * with a consumer budget query.
 */
const BRAND_DEFAULT_PRODUCT_TYPE: Record<string, string> = {
  samsung: "Smartphone",
  apple: "Smartphone",
  iphone: "Smartphone",
  oneplus: "Smartphone",
  xiaomi: "Smartphone",
  redmi: "Smartphone",
  realme: "Smartphone",
  oppo: "Smartphone",
  vivo: "Smartphone",
  motorola: "Smartphone",
  google: "Smartphone",
  pixel: "Smartphone",
  nothing: "Smartphone",
  iqoo: "Smartphone",
  poco: "Smartphone",

  hp: "Laptop",
  dell: "Laptop",
  lenovo: "Laptop",
  asus: "Laptop",
  acer: "Laptop",
  msi: "Laptop",

  boat: "Headphones",
  jbl: "Headphones",
  bose: "Headphones",
  sennheiser: "Headphones",

  canon: "Camera",
  nikon: "Camera",
  fujifilm: "Camera",

  nike: "Shoes",
  adidas: "Shoes",
  puma: "Shoes",
  reebok: "Shoes",
  skechers: "Shoes",

  maybelline: "Beauty",
  lakme: "Beauty",
  loreal: "Beauty",
  mac: "Beauty",
  nykaa: "Beauty",
};

/* =========================================================
   MAIN API
   ========================================================= */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query =
      typeof body?.query === "string"
        ? body.query.trim()
        : "";

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Please describe what you're looking for.",
        },
        { status: 400 }
      );
    }

    const lower = query.toLowerCase();

    /* ---------------------------------------------
       CATEGORY
       --------------------------------------------- */

    let category: string | null = null;

    for (const [cat, keywords] of Object.entries(
      PRODUCT_CATEGORIES
    )) {
      if (
        keywords.some((keyword) =>
          containsPhrase(lower, keyword)
        )
      ) {
        category = cat;
        break;
      }
    }

    /* ---------------------------------------------
       PRODUCT TYPE
       --------------------------------------------- */

    let productType: string | null = null;

    for (const [type, keywords] of Object.entries(
      PRODUCT_TYPE_ALIASES
    )) {
      if (
        keywords.some((keyword) =>
          containsPhrase(lower, keyword)
        )
      ) {
        productType = type;
        break;
      }
    }

    /* ---------------------------------------------
       BRAND
       --------------------------------------------- */

    let brand: string | null = null;

    for (const possibleBrand of BRANDS) {
      if (containsPhrase(lower, possibleBrand)) {
        brand = possibleBrand;

        /*
         * Make display name nicer.
         */
        brand =
          possibleBrand.charAt(0).toUpperCase() +
          possibleBrand.slice(1);

        break;
      }
    }

    /* ---------------------------------------------
       SPECIAL BRAND FIXES
       --------------------------------------------- */

    if (brand === "Iphone") {
      brand = "Apple";
    }

    if (brand === "Pixel") {
      brand = "Google";
    }

    /* ---------------------------------------------
       BRAND → DEFAULT PRODUCT TYPE FALLBACK
       ---------------------------------------------
       Only kicks in when the query gave us a brand but genuinely no
       product/category signal at all (e.g. "Samsung under 30000").
       If the user did mention a type ("Samsung fridge"), the loop
       above will have already caught it and this is skipped.
    */

    if (!productType && !category && brand) {
      const defaultType =
        BRAND_DEFAULT_PRODUCT_TYPE[brand.toLowerCase()];

      if (defaultType) {
        productType = defaultType;
        category = "Electronics";
      }
    }

    /* ---------------------------------------------
       BUDGET
       --------------------------------------------- */

    const budget = extractBudget(lower);

    /* ---------------------------------------------
       PURPOSE
       --------------------------------------------- */

    let purpose: string | null = null;

    for (const [p, keywords] of Object.entries(
      PURPOSE_KEYWORDS
    )) {
      if (
        keywords.some((keyword) =>
          containsPhrase(lower, keyword)
        )
      ) {
        purpose = p;
        break;
      }
    }

    /* ---------------------------------------------
       PREFERENCES
       --------------------------------------------- */

    const preferences = PREFERENCE_KEYWORDS.filter(
      (preference) =>
        containsPhrase(lower, preference)
    );

    /* ---------------------------------------------
       SEARCH QUERY
       --------------------------------------------- */

    const searchParts = [
      brand,
      productType,
      purpose,
      ...preferences.slice(0, 3),
    ].filter(Boolean);

    const searchTerms =
      searchParts.length > 0
        ? searchParts.join(" ")
        : query;

    const requirements: Requirements = {
      category,
      productType,
      brand,
      budget,
      purpose,
      preferences,
      searchTerms,
      originalQuery: query,
    };

    console.log(
      "AI SHOPPING UNDERSTOOD:",
      requirements
    );

    return NextResponse.json({
      success: true,
      requirements,
    });
  } catch (error) {
    console.error(
      "Understand route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Couldn't understand your shopping request.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PHRASE MATCH
   ========================================================= */

function containsPhrase(
  text: string,
  phrase: string
): boolean {
  const escaped = phrase.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  return new RegExp(
    `(^|\\s)${escaped}(?=\\s|$)`,
    "i"
  ).test(text);
}

/* =========================================================
   BUDGET PARSER
   ========================================================= */

function extractBudget(text: string): {
  min: number | null;
  max: number | null;
} {
  const toNumber = (raw: string): number => {
    let cleaned = raw
      .replace(/[₹,\s]/g, "")
      .toLowerCase();

    let multiplier = 1;

    if (cleaned.endsWith("lakh")) {
      multiplier = 100000;
      cleaned = cleaned.replace("lakh", "");
    } else if (cleaned.endsWith("k")) {
      multiplier = 1000;
      cleaned = cleaned.replace("k", "");
    }

    const number = parseFloat(cleaned);

    return Number.isNaN(number)
      ? 0
      : Math.round(number * multiplier);
  };

  /*
   * between 20000 and 30000
   */
  const betweenMatch = text.match(
    /between\s*₹?\s*([\d,.]+\s*(?:k|lakh)?)\s*(?:and|to|-)\s*₹?\s*([\d,.]+\s*(?:k|lakh)?)/i
  );

  if (betweenMatch) {
    return {
      min: toNumber(betweenMatch[1]),
      max: toNumber(betweenMatch[2]),
    };
  }

  /*
   * under 30000
   * below 30k
   * less than 1 lakh
   * within 50000
   */
  const underMatch = text.match(
    /(?:under|below|less than|within|max(?:imum)?|up to|upto)\s*₹?\s*([\d,.]+\s*(?:k|lakh)?)/i
  );

  if (underMatch) {
    return {
      min: null,
      max: toNumber(underMatch[1]),
    };
  }

  /*
   * above 30000
   */
  const aboveMatch = text.match(
    /(?:above|over|more than|at least)\s*₹?\s*([\d,.]+\s*(?:k|lakh)?)/i
  );

  if (aboveMatch) {
    return {
      min: toNumber(aboveMatch[1]),
      max: null,
    };
  }

  /*
   * around 30000
   */
  const aroundMatch = text.match(
    /(?:around|about|approximately|approx)\s*₹?\s*([\d,.]+\s*(?:k|lakh)?)/i
  );

  if (aroundMatch) {
    const value = toNumber(
      aroundMatch[1]
    );

    return {
      min: Math.round(value * 0.85),
      max: Math.round(value * 1.15),
    };
  }

  /*
   * Direct price expressions:
   *
   * "phone 30000"
   * "laptop 70k"
   */
  const directMatch = text.match(
    /(?:₹\s*)?([\d,.]+\s*(?:k|lakh))\b/i
  );

  if (directMatch) {
    const value = toNumber(
      directMatch[1]
    );

    return {
      min: null,
      max: value,
    };
  }

  return {
    min: null,
    max: null,
  };
}