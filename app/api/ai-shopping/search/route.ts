import { NextResponse } from "next/server";

// Headless browser navigation across 7 stores takes far longer than plain
// HTTP requests did. On Vercel this raises the function timeout; on other
// hosts it's harmless (ignored) but the actual server config may still need
// a matching timeout increase if requests are getting cut off.
export const maxDuration = 60;

import { searchAmazon } from "@/lib/scrapers/amazon";
import { searchFlipkart } from "@/lib/scrapers/flipkart";
import { searchMyntra } from "@/lib/scrapers/myntra";
import { searchSnapdeal } from "@/lib/scrapers/snapdeal";
import { searchTataCliq } from "@/lib/scrapers/tatacliq";
import { searchAjio } from "@/lib/scrapers/ajio";
import { searchNykaa } from "@/lib/scrapers/nykaa";

import { rankProducts } from "@/lib/rank";
import { Requirements, ScrapedProduct } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawRequirements = body?.requirements;

    if (!rawRequirements) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing search requirements.",
        },
        { status: 400 }
      );
    }

    const requirements: Requirements = {
      category: rawRequirements.category ?? null,

      productType: rawRequirements.productType ?? null,

      brand: rawRequirements.brand ?? null,

      budget: {
        min: rawRequirements.budget?.min ?? null,
        max: rawRequirements.budget?.max ?? null,
      },

      purpose: rawRequirements.purpose ?? null,

      preferences: Array.isArray(rawRequirements.preferences)
        ? rawRequirements.preferences
        : [],

      searchTerms:
        typeof rawRequirements.searchTerms === "string"
          ? rawRequirements.searchTerms.trim()
          : "",
    };

    /*
     * ---------------------------------------------------------
     * BUILD A BETTER SEARCH QUERY
     * ---------------------------------------------------------
     *
     * Prefer the structured filters (brand + product type/category +
     * purpose + a couple of preferences) when they're set, since those
     * make a much better literal search string on Amazon/Flipkart/etc.
     * than a full sentence like "I need a phone under 30000". Fall back
     * to the free-text query if no filters were selected.
     */

    const structuredParts = [
      requirements.brand,
      requirements.productType || requirements.category,
      requirements.purpose,
      ...requirements.preferences.slice(0, 2),
    ].filter(Boolean);

    const searchQuery =
      structuredParts.length > 0
        ? structuredParts.join(" ")
        : requirements.searchTerms?.trim() || "products";

    console.log("AI Shopping search:", {
      query: searchQuery,
      category: requirements.category,
      productType: requirements.productType,
      brand: requirements.brand,
      purpose: requirements.purpose,
      budget: requirements.budget,
      preferences: requirements.preferences,
    });

    /*
     * ---------------------------------------------------------
     * SEARCH ALL STORES
     * ---------------------------------------------------------
     *
     * Each scraper is isolated.
     *
     * If Amazon fails, the others can still work.
     */

    const stores = [
      {
        name: "Amazon",
        search: () => searchAmazon(searchQuery),
      },
      {
        name: "Flipkart",
        search: () => searchFlipkart(searchQuery),
      },
      {
        name: "Myntra",
        search: () => searchMyntra(searchQuery),
      },
      {
        name: "Snapdeal",
        search: () => searchSnapdeal(searchQuery),
      },
      {
        name: "Tata CLiQ",
        search: () => searchTataCliq(searchQuery),
      },
      {
        name: "AJIO",
        search: () => searchAjio(searchQuery),
      },
      {
        name: "Nykaa",
        search: () => searchNykaa(searchQuery),
      },
    ];

    /*
     * Promise.allSettled is important here.
     *
     * Promise.all:
     *   one failure = everything fails
     *
     * Promise.allSettled:
     *   one failure = other stores continue
     */

    const results = await Promise.allSettled(
      stores.map((store) => store.search())
    );

    const allProducts: ScrapedProduct[] = [];

    const storeStatus: Record<string, string> = {};

    results.forEach((result, index) => {
      const storeName = stores[index].name;

      if (result.status === "fulfilled") {
        const products = Array.isArray(result.value)
          ? result.value
          : [];

        allProducts.push(...products);

        storeStatus[storeName] = `${products.length} products`;
      } else {
        console.error(`${storeName} scraper failed:`, result.reason);

        storeStatus[storeName] = "unavailable";
      }
    });

    console.log("Store results:", storeStatus);
    console.log("Total products:", allProducts.length);

    /*
     * ---------------------------------------------------------
     * REMOVE DUPLICATES
     * ---------------------------------------------------------
     */

    const uniqueProducts = removeDuplicates(allProducts);

    /*
     * ---------------------------------------------------------
     * NO RESULTS
     * ---------------------------------------------------------
     */

    if (uniqueProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No live products were found right now. Some shopping websites may be blocking automated requests. Please try another search.",
          stores: storeStatus,
        },
        { status: 502 }
      );
    }

    /*
     * ---------------------------------------------------------
     * RANK PRODUCTS
     * ---------------------------------------------------------
     */

    const rankedProducts = rankProducts(uniqueProducts, requirements);

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      products: rankedProducts,

      count: rankedProducts.length,

      stores: storeStatus,

      requirements,
    });
  } catch (error) {
    console.error("AI Shopping search route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while searching.",
      },
      { status: 500 }
    );
  }
}

/*
 * ---------------------------------------------------------
 * REMOVE DUPLICATES
 * ---------------------------------------------------------
 */

function removeDuplicates(
  products: ScrapedProduct[]
): ScrapedProduct[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    const normalizedName = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    const key = `${product.source}-${normalizedName}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}