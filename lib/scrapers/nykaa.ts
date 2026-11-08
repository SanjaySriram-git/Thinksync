import * as cheerio from "cheerio";
import { withPage, looksBlocked } from "./browser";
import { ScrapedProduct } from "../types";

export async function searchNykaa(
  query: string
): Promise<ScrapedProduct[]> {
  /*
   * Nykaa is behind Akamai bot protection that a warm-up +
   * cookie persistence attempt did not get past.
   *
   * We fail fast rather than paying a long timeout for a
   * block that consistently doesn't clear.
   */

  const url = `https://www.nykaa.com/search/result/?q=${encodeURIComponent(
    query
  )}`;

  try {
    const html = await withPage(async (page) => {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForSelector(
          ".productWrapper, .css-d5z3ro, [data-testid='product-card']",
          {
            timeout: 5000,
          }
        )
        .catch(() => {});

      return page.content();
    });

    // ---------------------------------------------------
    // BLOCK CHECK
    // ---------------------------------------------------

    if (looksBlocked(html)) {
      console.warn(
        "Nykaa appears to be showing a block page (Akamai)."
      );

      return [];
    }

    const $ = cheerio.load(html);

    const products: ScrapedProduct[] = [];

    // ---------------------------------------------------
    // PRODUCT CARDS
    // ---------------------------------------------------

    $(
      ".productWrapper, .css-d5z3ro, [data-testid='product-card']"
    ).each((index, el) => {
      // -------------------------------------------------
      // PRODUCT NAME
      // -------------------------------------------------

      const name =
        $(el)
          .find(
            ".productName, .product-name, [data-testid='product-name']"
          )
          .first()
          .text()
          .trim() || "";

      // -------------------------------------------------
      // BRAND
      // -------------------------------------------------

      const brand =
        $(el)
          .find(
            ".brandName, .brand-name, [data-testid='product-brand']"
          )
          .first()
          .text()
          .trim() || null;

      // -------------------------------------------------
      // CURRENT PRICE
      // -------------------------------------------------

      const priceText =
        $(el)
          .find(
            ".price, .product-price, [data-testid='product-price']"
          )
          .first()
          .text()
          .trim() || "";

      // -------------------------------------------------
      // ORIGINAL PRICE
      // -------------------------------------------------

      const originalPriceText =
        $(el)
          .find(
            ".mrp, .original-price, .strike"
          )
          .first()
          .text()
          .trim() || "";

      // -------------------------------------------------
      // DISCOUNT
      // -------------------------------------------------

      const discountText =
        $(el)
          .find(
            ".discount, .discount-percentage"
          )
          .first()
          .text()
          .trim() || "";

      // -------------------------------------------------
      // RATING
      // -------------------------------------------------

      const ratingText =
        $(el)
          .find(
            ".rating, .ratingValue"
          )
          .first()
          .text()
          .trim() || "";

      // -------------------------------------------------
      // PRODUCT URL
      // -------------------------------------------------

      const href =
        $(el)
          .find("a")
          .first()
          .attr("href") || "";

      const productUrl = href
        ? href.startsWith("http")
          ? href
          : `https://www.nykaa.com${href}`
        : url;

      // -------------------------------------------------
      // IMAGE
      // -------------------------------------------------

      const image =
        $(el)
          .find("img")
          .first()
          .attr("src") ||
        $(el)
          .find("img")
          .first()
          .attr("data-src") ||
        null;

      // -------------------------------------------------
      // PARSE VALUES
      // -------------------------------------------------

      const price = parsePrice(priceText);

      const originalPrice =
        parsePrice(originalPriceText);

      // -------------------------------------------------
      // PRODUCT
      // -------------------------------------------------

      if (name && price > 0) {
        products.push({
          id: `nykaa-${index}-${Date.now()}`,

          source: "nykaa",

          name,

          brand,

          price,

          originalPrice:
            originalPrice > 0
              ? originalPrice
              : null,

          discount:
            parseDiscount(discountText),

          currency: "INR",

          rating:
            parseRating(ratingText),

          /*
           * The current Nykaa search page does not provide
           * reliable individual review text.
           *
           * Therefore we do not invent review data.
           */
          reviewCount: null,

          reviews: [],

          url: productUrl,

          image,
        });
      }
    });

    return products
      .filter((p) => p.price > 0)
      .slice(0, 10);
  } catch (error) {
    console.error(
      "Nykaa scrape failed:",
      error
    );

    return [];
  }
}

// =======================================================
// PRICE PARSER
// =======================================================

function parsePrice(text: string): number {
  const digits = text.replace(
    /[^0-9]/g,
    ""
  );

  return digits
    ? parseInt(digits, 10)
    : 0;
}

// =======================================================
// DISCOUNT PARSER
// =======================================================

function parseDiscount(
  text: string
): number | null {
  const match = text.match(
    /(\d+)%/
  );

  return match
    ? parseInt(match[1], 10)
    : null;
}

// =======================================================
// RATING PARSER
// =======================================================

function parseRating(
  text: string
): number | null {
  const match = text.match(
    /([0-5](?:\.[0-9])?)/
  );

  if (!match) {
    return null;
  }

  const rating = parseFloat(
    match[1]
  );

  return rating >= 0 && rating <= 5
    ? rating
    : null;
}