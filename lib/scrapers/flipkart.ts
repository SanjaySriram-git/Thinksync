import * as cheerio from "cheerio";
import { withPage } from "./browser";
import { ScrapedProduct } from "../types";

export async function searchFlipkart(
  query: string
): Promise<ScrapedProduct[]> {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(
    query
  )}`;

  try {
    const html = await withPage(async (page) => {
      // Warm up on the homepage first so this doesn't look like
      // a cold direct hit on a search URL.
      await page
        .goto("https://www.flipkart.com/", {
          waitUntil: "domcontentloaded",
        })
        .catch(() => {});

      await new Promise((r) =>
        setTimeout(r, 700 + Math.random() * 700)
      );

      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForSelector("div[data-id]", {
          timeout: 8000,
        })
        .catch(() => {});

      return page.content();
    });

    // ---------------------------------------------------
    // BLOCK / CAPTCHA CHECK
    // ---------------------------------------------------

    if (/recaptcha|are you a human/i.test(html)) {
      console.warn(
        "Flipkart served a reCAPTCHA challenge — " +
          "this is an active anti-bot wall, not a selector issue. " +
          "Skipping this store for now."
      );

      return [];
    }

    const $ = cheerio.load(html);

    const products: ScrapedProduct[] = [];

    // ---------------------------------------------------
    // PRODUCT CARDS
    // ---------------------------------------------------

    $("div[data-id]").each((_, el) => {
      // -------------------------------------------------
      // PRODUCT NAME
      // -------------------------------------------------

      const name = $(el)
        .find(
          "div._4rR01T, a.s1Q9rs, div.KzDlHZ"
        )
        .first()
        .text()
        .trim();

      // -------------------------------------------------
      // PRICE
      // -------------------------------------------------

      const priceText = $(el)
        .find(
          "div._30jeq3, div.Nx9bqj"
        )
        .first()
        .text()
        .trim();

      // -------------------------------------------------
      // RATING
      // -------------------------------------------------

      const ratingText = $(el)
        .find(
          "div._3LWZlK, div.XQDdHH"
        )
        .first()
        .text()
        .trim();

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
          : `https://www.flipkart.com${href}`
        : url;

      // -------------------------------------------------
      // IMAGE
      // -------------------------------------------------

      const image =
        $(el)
          .find("img")
          .first()
          .attr("src") || null;

      // -------------------------------------------------
      // REVIEW COUNT
      // -------------------------------------------------

      /*
       * We only read a review count if Flipkart exposes
       * one directly in the search card.
       *
       * We do NOT use review count as evidence that
       * reviews are fake.
       */

      const reviewText = $(el)
        .find(
          "span._2_R_DZ, " +
            "span._13vcmD, " +
            "div._3LWZlK + span"
        )
        .first()
        .text()
        .trim();

      const reviewCount =
        parseReviewCount(reviewText);

      // -------------------------------------------------
      // PRODUCT OBJECT
      // -------------------------------------------------

      if (name && priceText) {
        products.push({
          id: `flipkart-${products.length}-${Date.now()}`,

          source: "flipkart",

          name,

          price: parsePrice(priceText),

          currency: "INR",

          rating: ratingText
            ? parseFloat(ratingText)
            : null,

          reviewCount,

          /*
           * The Flipkart search page does not provide
           * reliable individual review text here.
           *
           * Therefore we leave reviews empty instead
           * of inventing review data.
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
  } catch (err) {
    console.error(
      "Flipkart scrape failed:",
      err
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
// REVIEW COUNT PARSER
// =======================================================

function parseReviewCount(
  text: string
): number | null {
  if (!text) {
    return null;
  }

  const cleaned = text
    .replace(/,/g, "")
    .trim();

  const match = cleaned.match(
    /(\d+)/
  );

  return match
    ? parseInt(match[1], 10)
    : null;
}