import * as cheerio from "cheerio";
import { withPage, looksBlocked } from "./browser";
import { ScrapedProduct } from "../types";

export async function searchAjio(
  query: string
): Promise<ScrapedProduct[]> {
  const url = `https://www.ajio.com/search/?text=${encodeURIComponent(
    query
  )}`;

  try {
    const html = await withPage(async (page) => {
      // AJIO is behind Akamai — visiting the homepage first
      // makes the request look more like normal browsing.
      await page
        .goto("https://www.ajio.com/", {
          waitUntil: "domcontentloaded",
        })
        .catch(() => {});

      await new Promise((r) =>
        setTimeout(r, 600 + Math.random() * 600)
      );

      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForSelector(
          ".item, .rilrtl-products-list__item, [data-testid='product-card']",
          {
            timeout: 8000,
          }
        )
        .catch(() => {});

      return page.content();
    });

    if (looksBlocked(html)) {
      console.warn(
        "AJIO appears to be showing a block page (Akamai)."
      );

      return [];
    }

    const $ = cheerio.load(html);

    const products: ScrapedProduct[] = [];

    $(
      ".item, .rilrtl-products-list__item, [data-testid='product-card']"
    ).each((index, el) => {
      // ---------------------------------------------------
      // NAME
      // ---------------------------------------------------

      const name =
        $(el)
          .find(
            ".nameCls, .brand, [data-testid='product-name']"
          )
          .first()
          .text()
          .trim() || "";

      // ---------------------------------------------------
      // BRAND
      // ---------------------------------------------------

      const brand =
        $(el)
          .find(".brand, .brand-name")
          .first()
          .text()
          .trim() || null;

      // ---------------------------------------------------
      // PRICE
      // ---------------------------------------------------

      const priceText =
        $(el)
          .find(
            ".price, .price-value, [data-testid='product-price']"
          )
          .first()
          .text()
          .trim() || "";

      // ---------------------------------------------------
      // ORIGINAL PRICE
      // ---------------------------------------------------

      const originalPriceText =
        $(el)
          .find(
            ".orginal-price, .original-price, .mrp"
          )
          .first()
          .text()
          .trim() || "";

      // ---------------------------------------------------
      // DISCOUNT
      // ---------------------------------------------------

      const discountText =
        $(el)
          .find(
            ".discount, .discount-percentage"
          )
          .first()
          .text()
          .trim() || "";

      // ---------------------------------------------------
      // RATING
      // ---------------------------------------------------

      const ratingText =
        $(el)
          .find(".rating, .stars")
          .first()
          .text()
          .trim() || "";

      // ---------------------------------------------------
      // PRODUCT URL
      // ---------------------------------------------------

      const href =
        $(el)
          .find("a")
          .first()
          .attr("href") || "";

      const productUrl = href
        ? href.startsWith("http")
          ? href
          : `https://www.ajio.com${href}`
        : url;

      // ---------------------------------------------------
      // IMAGE
      // ---------------------------------------------------

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

      // ---------------------------------------------------
      // PARSE VALUES
      // ---------------------------------------------------

      const price = parsePrice(priceText);

      const originalPrice =
        parsePrice(originalPriceText);

      const rating =
        parseRating(ratingText);

      const discount =
        parseDiscount(discountText);

      // ---------------------------------------------------
      // PRODUCT
      // ---------------------------------------------------

      if (name && price > 0) {
        products.push({
          id: `ajio-${index}-${Date.now()}`,

          source: "ajio",

          name,

          brand,

          price,

          originalPrice:
            originalPrice > 0
              ? originalPrice
              : null,

          discount,

          currency: "INR",

          rating,

          /*
           * AJIO search results currently do not provide
           * verified review-count data through the selectors
           * used by this scraper.
           */
          reviewCount: null,

          /*
           * Individual review text is not available from
           * this search-page scraper.
           *
           * We intentionally keep this empty instead of
           * inventing review information.
           */
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
      "AJIO scrape failed:",
      error
    );

    return [];
  }
}

/* =========================================================
   PRICE
========================================================= */

function parsePrice(
  text: string
): number {
  const digits = text.replace(
    /[^0-9]/g,
    ""
  );

  return digits
    ? parseInt(digits, 10)
    : 0;
}

/* =========================================================
   DISCOUNT
========================================================= */

function parseDiscount(
  text: string
): number | null {
  const match =
    text.match(/(\d+)%/);

  return match
    ? parseInt(match[1], 10)
    : null;
}

/* =========================================================
   RATING
========================================================= */

function parseRating(
  text: string
): number | null {
  const match =
    text.match(
      /([0-5](?:\.[0-9])?)/
    );

  if (!match) {
    return null;
  }

  const rating =
    parseFloat(match[1]);

  return rating >= 0 &&
    rating <= 5
    ? rating
    : null;
}