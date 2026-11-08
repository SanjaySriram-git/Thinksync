import * as cheerio from "cheerio";
import { withPage, looksBlocked } from "./browser";
import { ScrapedProduct } from "../types";

export async function searchTataCliq(
  query: string
): Promise<ScrapedProduct[]> {
  /*
   * Tata CLiQ is behind bot protection that a warm-up +
   * cookie persistence attempt did not get past.
   *
   * We fail fast rather than waiting for a long timeout
   * when the site consistently returns a block page.
   */

  const url = `https://www.tatacliq.com/search/?searchCategory=all&searchText=${encodeURIComponent(
    query
  )}`;

  try {
    const html = await withPage(async (page) => {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForSelector(
          '[data-testid="product-card"], .ProductModule__productCard, .product-card',
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
        "Tata CLiQ appears to be showing a block page."
      );

      return [];
    }

    const $ = cheerio.load(html);

    const products: ScrapedProduct[] = [];

    // ---------------------------------------------------
    // PRODUCT CARDS
    // ---------------------------------------------------

    $(
      '[data-testid="product-card"], .ProductModule__productCard, .product-card'
    ).each((index, el) => {
      // -------------------------------------------------
      // PRODUCT NAME
      // -------------------------------------------------

      const name =
        $(el)
          .find(
            '[data-testid="product-name"], .ProductModule__productName, .product-name'
          )
          .first()
          .text()
          .trim() ||
        $(el)
          .find("a")
          .first()
          .attr("title") ||
        "";

      // -------------------------------------------------
      // BRAND
      // -------------------------------------------------

      const brand =
        $(el)
          .find(
            '[data-testid="product-brand"], .ProductModule__brand, .product-brand'
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
            '[data-testid="product-price"], .ProductModule__price, .product-price'
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
            '[data-testid="product-original-price"], .ProductModule__mrp, .product-mrp'
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
            '[data-testid="product-discount"], .ProductModule__discount, .product-discount'
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
            '[data-testid="product-rating"], .ProductModule__rating, .product-rating'
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
          : `https://www.tatacliq.com${href}`
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
          id: `tatacliq-${index}-${Date.now()}`,

          source: "tatacliq",

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
           * The current Tata CLiQ search page does not
           * provide reliable individual review text.
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
      "Tata CLiQ scrape failed:",
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