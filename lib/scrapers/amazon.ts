import * as cheerio from "cheerio";
import { withPage, looksBlocked } from "./browser";
import { ScrapedProduct } from "../types";

export async function searchAmazon(
  query: string
): Promise<ScrapedProduct[]> {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;

  try {
    const html = await withPage(async (page) => {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForSelector(
          "div[data-component-type='s-search-result']",
          {
            timeout: 8000,
          }
        )
        .catch(() => {});

      return page.content();
    });

    if (looksBlocked(html)) {
      console.warn(
        "Amazon appears to be showing a block/CAPTCHA page."
      );

      return [];
    }

    const $ = cheerio.load(html);

    const products: ScrapedProduct[] = [];

    $("div[data-component-type='s-search-result']").each(
      (_, el) => {
        // ---------------------------------------------------
        // PRODUCT NAME
        // ---------------------------------------------------

        const name = $(el)
          .find("h2 span")
          .first()
          .text()
          .trim();

        // ---------------------------------------------------
        // PRICE
        // ---------------------------------------------------

        const priceWhole = $(el)
          .find("span.a-price-whole")
          .first()
          .text()
          .replace(/[.,]/g, "")
          .trim();

        // ---------------------------------------------------
        // RATING
        // ---------------------------------------------------

        const ratingText = $(el)
          .find("span.a-icon-alt")
          .first()
          .text()
          .trim();

        // ---------------------------------------------------
        // PRODUCT URL
        // ---------------------------------------------------

        const href = $(el)
          .find("h2 a")
          .first()
          .attr("href");

        const productUrl = href
          ? href.startsWith("http")
            ? href
            : `https://www.amazon.in${href}`
          : url;

        // ---------------------------------------------------
        // IMAGE
        // ---------------------------------------------------

        const image =
          $(el)
            .find("img.s-image")
            .first()
            .attr("src") || null;

        // ---------------------------------------------------
        // REVIEW COUNT
        // ---------------------------------------------------

        /*
         * Amazon search cards can expose review counts.
         *
         * We attempt to read the number from the rating-count
         * link, but leave it null if it isn't available.
         */

        const reviewCountText = $(el)
          .find(
            "a[aria-label*='ratings'], " +
              "a[aria-label*='rating'], " +
              "span.a-size-base.s-underline-text"
          )
          .first()
          .text()
          .trim();

        const reviewCount =
          parseReviewCount(reviewCountText);

        // ---------------------------------------------------
        // PRODUCT
        // ---------------------------------------------------

        if (name && priceWhole) {
          products.push({
            id: `amazon-${products.length}-${Date.now()}`,

            source: "amazon",

            name,

            price:
              parseInt(priceWhole, 10) || 0,

            currency: "INR",

            rating:
              ratingText
                ? parseFloat(
                    ratingText
                  )
                : null,

            reviewCount,

            /*
             * The current scraper works on the Amazon
             * search-results page. It does not open the
             * individual product review section.
             *
             * Therefore we do not invent review text.
             */
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
  } catch (err) {
    console.error(
      "Amazon scrape failed:",
      err
    );

    return [];
  }
}

/* =========================================================
   REVIEW COUNT
========================================================= */

function parseReviewCount(
  text: string
): number | null {
  if (!text) {
    return null;
  }

  const cleaned = text
    .replace(/,/g, "")
    .trim();

  // Example:
  // "1,234" -> 1234
  const normalMatch =
    cleaned.match(/(\d+)/);

  if (normalMatch) {
    return parseInt(
      normalMatch[1],
      10
    );
  }

  return null;
}