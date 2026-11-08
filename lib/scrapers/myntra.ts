import * as cheerio from "cheerio";
import { withPage, looksBlocked } from "./browser";
import { ScrapedProduct } from "../types";

export async function searchMyntra(
  query: string
): Promise<ScrapedProduct[]> {
  /*
   * Myntra doesn't have a simple documented public search URL.
   * This uses the existing browse-style URL pattern.
   *
   * Myntra is behind Akamai bot protection. If the page is blocked,
   * we fail fast and return an empty result instead of holding up
   * the entire multi-store search.
   */

  const url = `https://www.myntra.com/${encodeURIComponent(
    query.replace(/\s+/g, "-")
  )}`;

  try {
    const html = await withPage(async (page) => {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForSelector(".product-base", {
          timeout: 5000,
        })
        .catch(() => {});

      return page.content();
    });

    // ---------------------------------------------------
    // BLOCK CHECK
    // ---------------------------------------------------

    if (looksBlocked(html)) {
      console.warn(
        "Myntra appears to be showing a block page."
      );

      return [];
    }

    const $ = cheerio.load(html);

    const products: ScrapedProduct[] = [];

    // ---------------------------------------------------
    // PRODUCT CARDS
    // ---------------------------------------------------

    $(".product-base").each((index, el) => {
      // -------------------------------------------------
      // PRODUCT NAME
      // -------------------------------------------------

      const name = $(el)
        .find(".product-product")
        .first()
        .text()
        .trim();

      // -------------------------------------------------
      // BRAND
      // -------------------------------------------------

      const brand = $(el)
        .find(".product-brand")
        .first()
        .text()
        .trim();

      // -------------------------------------------------
      // CURRENT PRICE
      // -------------------------------------------------

      const priceText = $(el)
        .find(".product-discountedPrice")
        .first()
        .text()
        .trim();

      // -------------------------------------------------
      // ORIGINAL PRICE
      // -------------------------------------------------

      const originalPriceText = $(el)
        .find(".product-strike")
        .first()
        .text()
        .trim();

      // -------------------------------------------------
      // DISCOUNT
      // -------------------------------------------------

      const discountText = $(el)
        .find(".product-discountPercentage")
        .first()
        .text()
        .trim();

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
      // PRODUCT URL
      // -------------------------------------------------

      const href = $(el)
        .find("a")
        .first()
        .attr("href");

      const productUrl = href
        ? href.startsWith("http")
          ? href
          : `https://www.myntra.com${href}`
        : url;

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
          id: `myntra-${index}-${Date.now()}`,

          source: "myntra",

          name,

          brand: brand || null,

          price,

          originalPrice:
            originalPrice > 0
              ? originalPrice
              : null,

          discount:
            parseDiscount(discountText),

          currency: "INR",

          /*
           * Myntra search cards currently do not provide
           * reliable individual review data.
           */
          rating: null,

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
      "Myntra scrape failed:",
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