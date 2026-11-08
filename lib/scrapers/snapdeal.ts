import * as cheerio from "cheerio";
import { withPage, looksBlocked } from "./browser";
import { ScrapedProduct } from "../types";

export async function searchSnapdeal(
  query: string
): Promise<ScrapedProduct[]> {
  const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(
    query
  )}`;

  try {
    const html = await withPage(async (page) => {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForSelector(".product-tuple-listing", {
          timeout: 8000,
        })
        .catch(() => {});

      return page.content();
    });

    // ---------------------------------------------------
    // BLOCK CHECK
    // ---------------------------------------------------

    if (looksBlocked(html)) {
      console.warn(
        "Snapdeal appears to be showing a block page."
      );

      return [];
    }

    const $ = cheerio.load(html);

    const products: ScrapedProduct[] = [];

    // ---------------------------------------------------
    // PRODUCT CARDS
    // ---------------------------------------------------

    $(".product-tuple-listing").each(
      (index, el) => {
        // -------------------------------------------------
        // PRODUCT NAME
        // -------------------------------------------------

        const name = $(el)
          .find(".product-title")
          .first()
          .text()
          .trim();

        // -------------------------------------------------
        // CURRENT PRICE
        // -------------------------------------------------

        const priceText = $(el)
          .find(".product-price")
          .first()
          .text()
          .trim();

        // -------------------------------------------------
        // ORIGINAL PRICE
        // -------------------------------------------------

        const originalPriceText = $(el)
          .find(".lfloat.product-desc-price")
          .first()
          .text()
          .trim();

        // -------------------------------------------------
        // DISCOUNT
        // -------------------------------------------------

        const discountText = $(el)
          .find(".product-discount")
          .first()
          .text()
          .trim();

        // -------------------------------------------------
        // RATING
        // -------------------------------------------------

        const ratingStyle = $(el)
          .find(".filled-stars")
          .first()
          .attr("style");

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
            : `https://www.snapdeal.com${href}`
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
            id: `snapdeal-${index}-${Date.now()}`,

            source: "snapdeal",

            name,

            brand: null,

            price,

            originalPrice:
              originalPrice > 0
                ? originalPrice
                : null,

            discount:
              parseDiscount(discountText),

            currency: "INR",

            rating:
              parseRating(ratingStyle),

            /*
             * The search page does not provide reliable
             * individual review text.
             */
            reviewCount: null,

            reviews: [],

            url: productUrl,

            image,
          });
        }
      }
    );

    return products
      .filter((p) => p.price > 0)
      .slice(0, 10);
  } catch (error) {
    console.error(
      "Snapdeal scrape failed:",
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
  style: string | undefined
): number | null {
  if (!style) {
    return null;
  }

  const match = style.match(
    /width:\s*([\d.]+)%/
  );

  if (!match) {
    return null;
  }

  const percentage = parseFloat(
    match[1]
  );

  if (isNaN(percentage)) {
    return null;
  }

  return Math.round(
    (percentage / 20) * 10
  ) / 10;
}