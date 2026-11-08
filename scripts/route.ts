/**
 * Run this from your project root with:
 *   node scripts/debug-scrapers.js
 *
 * It fetches the raw HTML each scraper would get for a test query on
 * every store, and reports:
 *   - HTTP status
 *   - total HTML length
 *   - whether any of that store's product-card selector hints appear
 *     anywhere in the raw HTML at all
 *
 * This tells us, per store, which of three situations we're in:
 *   1. Selectors are just wrong/outdated  -> HTML is large and DOES
 *      contain some product-ish text, but not matching our selectors.
 *   2. The site is a JS-rendered shell    -> HTML is small/mostly
 *      script tags, no product text anywhere.
 *   3. We're being blocked                -> status isn't 200, or the
 *      HTML is a captcha/"unusual traffic" page.
 */

const axios = require("axios");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "en-IN,en;q=0.9",
};

const QUERY = "laptop";

const SITES = [
  {
    name: "Amazon",
    url: `https://www.amazon.in/s?k=${encodeURIComponent(QUERY)}`,
    hint: "s-search-result",
  },
  {
    name: "Flipkart",
    url: `https://www.flipkart.com/search?q=${encodeURIComponent(QUERY)}`,
    hint: "_4rR01T",
  },
  {
    name: "Snapdeal",
    url: `https://www.snapdeal.com/search?keyword=${encodeURIComponent(QUERY)}`,
    hint: "product-tuple-listing",
  },
  {
    name: "Myntra",
    url: `https://www.myntra.com/${QUERY.replace(/\s+/g, "-")}`,
    hint: "product-base",
  },
  {
    name: "Tata CLiQ",
    url: `https://www.tatacliq.com/search/?searchCategory=all&searchText=${encodeURIComponent(
      QUERY
    )}`,
    hint: "ProductModule",
  },
  {
    name: "AJIO",
    url: `https://www.ajio.com/search/?text=${encodeURIComponent(QUERY)}`,
    hint: "rilrtl-products-list",
  },
  {
    name: "Nykaa",
    url: `https://www.nykaa.com/search/result/?q=${encodeURIComponent(QUERY)}`,
    hint: "productWrapper",
  },
];

async function check(site) {
  try {
    const res = await axios.get(site.url, {
      headers: HEADERS,
      timeout: 10000,
      validateStatus: () => true, // don't throw on 403/503, we want to see it
    });

    const html = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    const looksBlocked =
      /captcha|unusual traffic|access denied|are you a robot/i.test(html);
    const hasHint = html.includes(site.hint);
    const scriptTagCount = (html.match(/<script/g) || []).length;

    console.log(`\n=== ${site.name} ===`);
    console.log("HTTP status:", res.status);
    console.log("HTML length:", html.length, "chars");
    console.log("Script tags found:", scriptTagCount);
    console.log(`Contains "${site.hint}" (our selector hint):`, hasHint);
    console.log("Looks like a block/CAPTCHA page:", looksBlocked);

    if (!hasHint && !looksBlocked && html.length < 50000) {
      console.log(
        "-> Likely a JS-rendered shell (small HTML, lots of scripts, no product markup)."
      );
    } else if (!hasHint && looksBlocked) {
      console.log("-> Likely being blocked by anti-bot protection.");
    } else if (!hasHint) {
      console.log(
        "-> HTML is present but selector hint not found — selectors are probably outdated."
      );
    } else {
      console.log("-> Selector hint found — scraper should be working for this site.");
    }
  } catch (err) {
    console.log(`\n=== ${site.name} ===`);
    console.log("Request failed entirely:", err.message);
  }
}

(async () => {
  for (const site of SITES) {
    await check(site);
  }
})();