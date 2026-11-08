import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";

const DEFAULT_TIMEOUT_MS = 20000;

const REALISTIC_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

let browserPromise: Promise<Browser> | null = null;

/**
 * Launches (once) and reuses a single headless Chromium instance across all
 * scraper calls in this server process, rather than launching a fresh one
 * per request.
 */
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
      ],
    });

    // If launching failed, don't cache the rejected promise forever —
    // let the next call try again.
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }

  return browserPromise;
}

/**
 * Manually patches the most common headless-Chrome detection signals.
 *
 * This replaces puppeteer-extra-plugin-stealth, which has a known,
 * long-standing version-compatibility bug in its dependency chain
 * ("utils.typeOf is not a function") that isn't reliably fixable by
 * pinning versions. This covers the same basics — hiding
 * navigator.webdriver, faking window.chrome, non-empty plugins/languages —
 * without that fragile package.
 */
async function applyStealthTweaks(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // @ts-expect-error - window.chrome doesn't exist in headless Chrome by default
    window.chrome = window.chrome || { runtime: {} };

    Object.defineProperty(navigator, "languages", {
      get: () => ["en-IN", "en"],
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    const originalQuery = window.navigator.permissions.query;
    // @ts-expect-error - narrowing the type here isn't worth the noise
    window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
          } as PermissionStatus)
        : originalQuery(parameters);
  });
}

/**
 * Opens a fresh tab, sets up realistic browser fingerprint basics, runs
 * `fn`, then always closes the tab (even on error). The shared browser
 * instance itself stays alive for the next call.
 */
export async function withPage<T>(
  fn: (page: Page) => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(REALISTIC_USER_AGENT);
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9" });
    page.setDefaultNavigationTimeout(timeoutMs);
    page.setDefaultTimeout(timeoutMs);
    await applyStealthTweaks(page);

    return await fn(page);
  } finally {
    await page.close().catch(() => {
      // Ignore — the page/browser may already be gone.
    });
  }
}

/** Call on server shutdown if you want a clean exit; optional in dev. */
export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser) {
      await browser.close().catch(() => {});
    }
    browserPromise = null;
  }
}

/**
 * Simulates a bit of human-like activity — a few randomized mouse moves and
 * a scroll — after landing on a page. Some bot-detection systems (Akamai
 * included) weight behavioral signals like this alongside network-level
 * checks, so a page that never moves the mouse or scrolls can look more
 * suspicious even with a convincing User-Agent. Best-effort only: never
 * lets a failure here break the actual scrape.
 */
export async function simulateHumanBehavior(page: Page): Promise<void> {
  try {
    const viewport = page.viewport();
    const width = viewport?.width ?? 1366;
    const height = viewport?.height ?? 768;

    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      await page.mouse.move(x, y, { steps: 10 });
      await new Promise((r) => setTimeout(r, 150 + Math.random() * 250));
    }

    await page.evaluate(() => {
      window.scrollBy(0, Math.floor(Math.random() * 400) + 200);
    });

    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
  } catch {
    // Ignore — this is a best-effort nicety, not required for scraping to work.
  }
}

/**
 * Quick heuristic check for common block/CAPTCHA page text. Not perfect,
 * but catches the Akamai "Access Denied" and generic "unusual traffic"
 * pages we saw in testing.
 */
export function looksBlocked(html: string): boolean {
  return /captcha|unusual traffic|access denied|are you a robot|are you a human/i.test(
    html
  );
}

/*
 * ---------------------------------------------------------
 * COOKIE PERSISTENCE
 * ---------------------------------------------------------
 *
 * Pages created via browser.newPage() already share cookies with each
 * other within one running server process (they're all in the browser's
 * default context). This adds a second layer on top: saving cookies to
 * disk so a "good" session (one that got past a site's bot check) survives
 * a dev-server restart instead of starting from zero every time.
 */

const COOKIE_DIR = path.join(process.cwd(), ".cache", "scraper-cookies");

function cookieFilePath(siteKey: string): string {
  return path.join(COOKIE_DIR, `${siteKey}.json`);
}

async function loadCookies(page: Page, siteKey: string): Promise<void> {
  try {
    const filePath = cookieFilePath(siteKey);
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, "utf-8");
    const cookies = JSON.parse(raw);

    if (Array.isArray(cookies) && cookies.length > 0) {
      await page.setCookie(...cookies);
    }
  } catch {
    // Best-effort only — a missing/corrupt cookie file just means we
    // start this warm-up from a clean slate instead of failing the scrape.
  }
}

async function saveCookies(page: Page, siteKey: string): Promise<void> {
  try {
    if (!fs.existsSync(COOKIE_DIR)) {
      fs.mkdirSync(COOKIE_DIR, { recursive: true });
    }

    const cookies = await page.cookies();
    fs.writeFileSync(
      cookieFilePath(siteKey),
      JSON.stringify(cookies, null, 2)
    );
  } catch {
    // Best-effort only.
  }
}

/**
 * Heavier warm-up for sites with strict Akamai-style bot rules: loads any
 * previously saved cookies, visits the homepage, simulates some human
 * interaction, waits a longer randomized delay, then saves whatever
 * cookies were issued for next time.
 *
 * This does not guarantee getting past bot detection — it raises the
 * odds by looking like a returning, active browser session rather than a
 * cold, scripted hit, which is the same category of signal Akamai
 * evaluates, just with more of it than the lighter warm-up used elsewhere.
 */
export async function warmUpSite(
  page: Page,
  siteKey: string,
  homepageUrl: string,
  options?: { minDelayMs?: number; maxDelayMs?: number }
): Promise<void> {
  const minDelay = options?.minDelayMs ?? 1500;
  const maxDelay = options?.maxDelayMs ?? 2800;

  await loadCookies(page, siteKey);

  await page
    .goto(homepageUrl, { waitUntil: "domcontentloaded" })
    .catch(() => {});

  await simulateHumanBehavior(page);

  await new Promise((r) =>
    setTimeout(r, minDelay + Math.random() * (maxDelay - minDelay))
  );

  await saveCookies(page, siteKey);
}