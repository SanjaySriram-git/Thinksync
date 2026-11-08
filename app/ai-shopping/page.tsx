"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Source = "amazon" | "flipkart" | "myntra" | "snapdeal" | "tatacliq" | "ajio" | "nykaa";

type Product = {
  id: string;
  source: Source;
  name: string;
  price: number;
  currency?: string;
  rating?: number | null;
  reviewCount?: number | null;
  url: string;
  image?: string | null;
  match?: number;
  reason?: string;
};

type Requirements = {
  category: string | null;
  productType?: string | null;
  budget: { min: number | null; max: number | null };
  purpose: string | null;
  preferences: string[];
  searchTerms: string;
};

const CATEGORIES: Record<string, { label: string; types: string[] }> = {
  electronics: { label: "Electronics", types: ["Phone", "Laptop", "Tablet", "Headphones", "Smartwatch", "Television", "Camera", "Speaker", "Monitor", "Keyboard", "Mouse", "Other electronics"] },
  fashion: { label: "Fashion", types: ["Men clothing", "Women clothing", "Kids clothing", "Shoes", "Sneakers", "Saree", "Kurta", "Jeans", "T-shirt", "Jacket", "Bag", "Watch", "Accessories"] },
  appliances: { label: "Appliances", types: ["Refrigerator", "Washing machine", "Air conditioner", "Microwave", "Air cooler", "Vacuum cleaner", "Mixer grinder", "Induction stove", "Water purifier", "Coffee machine", "Other appliance"] },
  beauty: { label: "Beauty", types: ["Makeup", "Skincare", "Haircare", "Perfume", "Lipstick", "Foundation", "Face wash", "Moisturizer", "Sunscreen", "Hair dryer", "Beauty tools"] },
  home: { label: "Home & Kitchen", types: ["Furniture", "Kitchenware", "Cookware", "Bedsheet", "Curtains", "Decor", "Lighting", "Storage", "Mattress", "Chair", "Table", "Other home product"] },
  groceries: { label: "Groceries", types: ["Food", "Snacks", "Beverages", "Rice", "Cooking oil", "Spices", "Personal care", "Household items"] },
  sports: { label: "Sports & Fitness", types: ["Gym equipment", "Running shoes", "Sports shoes", "Cricket", "Football", "Badminton", "Cycling", "Yoga", "Fitness accessories"] },
  books: { label: "Books", types: ["Academic book", "Programming book", "Fiction", "Non-fiction", "Competitive exam book", "Children's book", "Other book"] },
  automotive: { label: "Automotive", types: ["Car accessories", "Bike accessories", "Car care", "Helmet", "Tyres", "Electronics", "Tools", "Other automotive"] },
  "health-personal-care": { label: "Health & Personal Care", types: ["Personal care", "Fitness", "Oral care", "Hair care", "Body care", "Grooming", "Other"] },
  other: { label: "Other", types: ["Gift", "Toys", "Stationery", "Pet products", "Other"] },
};

const PURPOSES = ["Any purpose", "Work", "Study", "Gaming", "Coding", "Travel", "Fitness", "Photography", "Entertainment", "Daily use", "Gift", "Professional use"];

const PREFERENCES = ["Lightweight", "Long battery life", "Fast", "Durable", "Premium", "Compact", "Good camera", "Large storage"];

const STORES: { key: Source; label: string }[] = [
  { key: "amazon", label: "Amazon" },
  { key: "flipkart", label: "Flipkart" },
  { key: "myntra", label: "Myntra" },
  { key: "snapdeal", label: "Snapdeal" },
  { key: "tatacliq", label: "Tata CLiQ" },
  { key: "ajio", label: "AJIO" },
  { key: "nykaa", label: "Nykaa" },
];

const DEFAULT_MAX_BUDGET = "70000";

/* ---------- Loader settings ---------- */
const ORBIT_RADIUS = 105; // px, distance of the tiles from the centre
const ORBIT_SLOTS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];
const STORE_TICK_MS = 900; // how often the next website is "checked"
const MIN_LOADING_MS = 2800; // loader always plays at least this long
const SUCCESS_MS = 1700; // how long the "Products found" screen stays

const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const dist = 110 + ((i * 37) % 60);
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
    color: ["#22d3ee", "#4ade80", "#facc15", "#f87171", "#a78bfa"][i % 5],
    delay: (i % 5) * 40,
    size: 4 + (i % 3) * 2,
  };
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function AIShoppingPage() {
  /* ---------- Splash screen ---------- */
  const [showSplash, setShowSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setSplashLeaving(true), 1100);
    const removeTimer = setTimeout(() => setShowSplash(false), 1650);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  /* ---------- Form + results state ---------- */
  const [query, setQuery] = useState("I need a phone under 30000");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [purpose, setPurpose] = useState("Any purpose");
  const [maxBudget, setMaxBudget] = useState("70000");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [storeStatus, setStoreStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  /* ---------- Loader state ---------- */
  const [tick, setTick] = useState(0);
  const [successInfo, setSuccessInfo] = useState<{ count: number; stores: number } | null>(null);
  const loaderRef = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  // Move to the next website every STORE_TICK_MS while searching.
  useEffect(() => {
    if (!loading) return;
    setTick(0);
    const id = setInterval(() => setTick((t) => t + 1), STORE_TICK_MS);
    return () => clearInterval(id);
  }, [loading]);

  // Bring the loader into view when searching starts, and the results when done.
  useEffect(() => {
    if (loading) {
      loaderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (searched && products.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Which website each of the 4 orbiting tiles shows right now.
  // Every tick, one tile switches to the next store in the list.
  const latest = tick + 3;
  const orbitTiles = ORBIT_SLOTS.map((slot, j) => {
    const k = latest - ((((latest - j) % 4) + 4) % 4);
    return { slot, k, store: STORES[k % STORES.length], active: k === latest };
  });
  const activeStore = STORES[latest % STORES.length];

  const availableProductTypes = useMemo(() => {
    if (!category) return [];
    return CATEGORIES[category]?.types ?? [];
  }, [category]);

  function togglePreference(value: string) {
    setPreferences((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setProductType("");
  }

  function clearFilters() {
    setCategory("");
    setProductType("");
    setPurpose("Any purpose");
    setMaxBudget("70000");
    setPreferences([]);
  }

  function buildRequirements(understood: Requirements | null): Requirements {
    const numericBudget = Number(maxBudget.replace(/[^0-9]/g, ""));
    const budgetTouched = maxBudget !== DEFAULT_MAX_BUDGET;
    const formBudgetMax = Number.isFinite(numericBudget) && numericBudget > 0 ? numericBudget : null;

    // Explicit dropdown/checkbox selections always win. Anything left at
    // its default falls back to what the AI understood from the free-text
    // query, so an un-filtered search still resolves a real product type
    // instead of sending the whole sentence straight to the scrapers.
    return {
      category: category ? CATEGORIES[category]?.label ?? category : understood?.category ?? null,
      productType: productType || understood?.productType || null,
      budget: {
        min: understood?.budget?.min ?? null,
        max: budgetTouched ? formBudgetMax : understood?.budget?.max ?? formBudgetMax,
      },
      purpose: purpose !== "Any purpose" ? purpose : understood?.purpose ?? null,
      preferences: preferences.length > 0 ? preferences : understood?.preferences ?? [],
      searchTerms: query.trim(),
    };
  }

  async function searchProducts() {
    if (!query.trim() && !category && !productType) {
      setError("Please describe what you are looking for or select a category.");
      return;
    }

    const startedAt = Date.now();

    setLoading(true);
    setError("");
    setSearched(true);
    setProducts([]);
    setRequirements(null);
    setStoreStatus({});
    setSuccessInfo(null);

    try {
      let understood: Requirements | null = null;

      if (query.trim()) {
        try {
          const understandRes = await fetch("/api/ai-shopping/understand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query.trim() }),
          });
          const understandData = await understandRes.json();

          if (understandRes.ok && understandData.success) {
            understood = understandData.requirements;
          } else {
            console.warn("Understand call did not succeed, falling back to filters only:", understandData);
          }
        } catch (understandErr) {
          console.error("Understand call failed, falling back to filters only:", understandErr);
        }
      }

      const requestRequirements = buildRequirements(understood);
      console.log("AI Shopping requirements:", requestRequirements);

      const response = await fetch("/api/ai-shopping/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements: requestRequirements }),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseText = await response.text();

      console.log("API status:", response.status);
      console.log("API content-type:", contentType);
      console.log("API response:", responseText);

      if (!response.ok) {
        throw new Error(`API request failed (${response.status}): ${responseText.slice(0, 300)}`);
      }

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The shopping API returned HTML instead of JSON. Check the API route path and terminal."
        );
      }

      const data = JSON.parse(responseText);

      if (!data.success) {
        throw new Error(data.error || "Shopping search failed.");
      }

      console.log("AI Shopping response:", data);

      const found: Product[] = Array.isArray(data.products) ? data.products : [];

      if (found.length > 0) {
        // Let the store animation play for a minimum time, then celebrate.
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_LOADING_MS) await sleep(MIN_LOADING_MS - elapsed);

        setSuccessInfo({ count: found.length, stores: new Set(found.map((p) => p.source)).size });
        await sleep(SUCCESS_MS);
      }

      setProducts(found);
      setRequirements(data.requirements ?? requestRequirements);
      setStoreStatus(data.stores ?? {});

      if (found.length === 0) {
        setError("No products were found right now. Try a different search.");
      }
    } catch (err) {
      console.error("AI Shopping search error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong while searching.");
    } finally {
      setLoading(false);
      setSuccessInfo(null);
    }
  }

  function formatPrice(price: number) {
    if (typeof price !== "number" || Number.isNaN(price)) return "Price unavailable";
    return `₹${price.toLocaleString("en-IN")}`;
  }

  function getStoreName(source: Source) {
    return STORES.find((item) => item.key === source)?.label ?? source;
  }

  return (
    <>
      {/* SPLASH SCREEN */}
      {showSplash && (
        <div className={`splash-screen ${splashLeaving ? "splash-leaving" : ""}`}>
          <div className="splash-ring">
            <div className="splash-core">
              <span className="splash-text">TS</span>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-12">
          {/* HERO */}
          <section className="mb-8">
            <div className="mb-4 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              ✨ AI Powered Shopping
            </div>
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Find the right product.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-200/80">
              Tell AI what you need. We'll understand your requirements, compare products and find
              suitable options across multiple shopping platforms.
            </p>
          </section>

          {/* SEARCH */}
          <section className="rounded-3xl border border-white/10 bg-[#0c101e] p-5 shadow-2xl">
            <label className="mb-3 block text-sm font-semibold text-white">What are you looking for?</label>

            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) searchProducts();
                }}
                placeholder="Example: I need a laptop for coding under ₹70,000 with good battery"
                className="h-14 flex-1 rounded-2xl border border-white/10 bg-[#080b14] px-5 text-base text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400/50"
              />
              <button
                onClick={searchProducts}
                disabled={loading}
                className="h-14 rounded-2xl bg-cyan-400 px-8 font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Searching..." : "Find Products →"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Best laptop for coding", "Phone under ₹30,000", "Headphones for gym", "Gift for my friend"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-blue-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </section>

          {/* FILTERS */}
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#0c101e] p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Refine your search</h2>
                <p className="mt-1 text-sm text-blue-200/60">
                  Optional — AI can understand your natural-language request without these.
                </p>
              </div>
              <button onClick={clearFilters} className="text-sm text-blue-300 hover:text-cyan-300">
                Clear
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm text-blue-200">Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#080b14] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="">Any category</option>
                  {Object.entries(CATEGORIES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-blue-200">Product type</label>
                <select
                  value={productType}
                  disabled={!category}
                  onChange={(e) => setProductType(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#080b14] px-4 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-40 focus:border-cyan-400/50"
                >
                  <option value="">{category ? "Any product type" : "Select category first"}</option>
                  {availableProductTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-blue-200">Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#080b14] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  {PURPOSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-blue-200">Maximum budget</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#080b14] pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-3 block text-sm text-blue-200">Preferences</label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((preference) => {
                  const active = preferences.includes(preference);
                  return (
                    <button
                      key={preference}
                      onClick={() => togglePreference(preference)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                          : "border-white/10 bg-white/[0.02] text-blue-200 hover:border-cyan-400/40"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {preference}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* STORES */}
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#0c101e] p-6">
            <h3 className="mb-4 text-sm font-semibold text-blue-200">Searching across</h3>

            <div className="flex flex-wrap gap-3">
              {STORES.map((store) => {
                const isActive = loading && !successInfo && store.key === activeStore.key;
                return (
                  <div
                    key={store.key}
                    className={`rounded-xl border px-5 py-3 text-sm transition ${
                      isActive
                        ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                        : "border-white/10 bg-[#080b14] text-blue-200"
                    }`}
                  >
                    {store.label}
                    {storeStatus[store.label] && (
                      <span className="ml-2 text-xs text-gray-500">({storeStatus[store.label]})</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <section className="mt-6 rounded-2xl border border-red-500/40 bg-red-950/20 p-5">
              <p className="font-medium text-red-300">{error}</p>
              <p className="mt-2 text-sm text-red-300/60">
                Check your terminal for the detailed scraper/API error. Some shopping websites may block
                automated requests.
              </p>
            </section>
          )}

          {/* LOADING — orbiting store tiles, then success */}
          {loading && (
            <section
              ref={loaderRef}
              className="loader-card mt-8 rounded-3xl border border-white/10 bg-[#0c101e] px-6 py-10 text-center"
            >
              {!successInfo ? (
                <>
                  <h3 className="text-2xl font-bold">Searching stores...</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Checking{" "}
                    <span key={activeStore.key} className="status-name font-semibold text-cyan-300">
                      {activeStore.label}
                    </span>
                  </p>

                  <div className="orbit-wrap mt-6">
                    <div className="ring ring-outer" />
                    <div className="ring ring-inner" />

                    <div className="orbit">
                      {orbitTiles.map(({ slot, k, store, active }, j) => (
                        <div
                          key={j}
                          className="slot"
                          style={{
                            left: `calc(50% + ${slot.x * ORBIT_RADIUS}px)`,
                            top: `calc(50% + ${slot.y * ORBIT_RADIUS}px)`,
                          }}
                        >
                          <div className="counter">
                            <div key={k} className={`tile ${active ? "tile-active" : ""}`}>
                              <span>{store.label}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">Comparing prices, ratings and reviews</p>
                </>
              ) : (
                <>
                  <h3 className="ok-title text-2xl font-bold text-green-400">Products found!</h3>
                  <p className="mt-2 text-sm text-gray-400">
                    {successInfo.count} products from {successInfo.stores}{" "}
                    {successInfo.stores === 1 ? "store" : "stores"}
                  </p>

                  <div className="orbit-wrap mt-6">
                    <div className="ring ok-ring-outer" />
                    <div className="ring ok-ring-inner" />

                    <div className="ok-tile">
                      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path className="ok-check" d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </div>

                    {CONFETTI.map((c, i) => (
                      <span
                        key={i}
                        className="confetti"
                        style={
                          {
                            "--tx": `${c.tx}px`,
                            "--ty": `${c.ty}px`,
                            background: c.color,
                            width: c.size,
                            height: c.size,
                            animationDelay: `${c.delay}ms`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-green-400/80">Loading your recommendations...</p>
                </>
              )}
            </section>
          )}

          {/* AI REQUIREMENTS */}
          {!loading && requirements && (
            <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.03] p-6">
              <h2 className="text-lg font-bold">🤖 AI understood your requirements</h2>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className="text-gray-500">Category</span>
                  <p className="mt-1 text-blue-200">{requirements.category ?? "Any"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Product</span>
                  <p className="mt-1 text-blue-200">{requirements.productType ?? "Any"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Purpose</span>
                  <p className="mt-1 text-blue-200">{requirements.purpose ?? "Any"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Budget</span>
                  <p className="mt-1 text-blue-200">
                    {requirements.budget.max ? `Up to ${formatPrice(requirements.budget.max)}` : "Any"}
                  </p>
                </div>
              </div>

              {requirements.preferences?.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Preferences</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {requirements.preferences.map((item) => (
                      <span key={item} className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* RESULTS */}
          {searched && !loading && products.length > 0 && (
            <section ref={resultsRef} className="mt-8 scroll-mt-6">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Recommended products</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {products.length} products found across shopping platforms
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <article
                    key={`${product.source}-${product.id}`}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0c101e] transition hover:-translate-y-1 hover:border-cyan-400/30"
                  >
                    <div className="flex h-64 items-center justify-center bg-white/[0.02] p-5">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (
                              e.currentTarget.parentElement?.querySelector(".image-fallback") as HTMLElement | null
                            )?.classList.remove("hidden");
                            e.currentTarget.classList.add("hidden");
                          }}
                        />
                      ) : null}

                      <div className={`image-fallback text-center text-sm text-gray-500 ${product.image ? "hidden" : ""}`}>
                        No image available
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-cyan-300">
                          {getStoreName(product.source)}
                        </span>
                        {typeof product.match === "number" && (
                          <span className="text-xs font-semibold text-green-400">{product.match}% match</span>
                        )}
                      </div>

                      <h3 className="line-clamp-2 min-h-[48px] text-base font-semibold">{product.name}</h3>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold">{formatPrice(product.price)}</span>
                        {product.rating != null && (
                          <span className="text-sm text-yellow-400">★ {product.rating.toFixed(1)}</span>
                        )}
                      </div>

                      {product.reviewCount != null && (
                        <p className="mt-1 text-xs text-gray-500">
                          {product.reviewCount.toLocaleString("en-IN")} reviews
                        </p>
                      )}

                      {product.reason && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-blue-200/60">{product.reason}</p>
                      )}

                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 block rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-cyan-300"
                      >
                        View Product →
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* NO RESULTS */}
          {searched && !loading && !error && products.length === 0 && (
            <section className="mt-8 rounded-3xl border border-white/10 bg-[#0c101e] p-10 text-center">
              <div className="text-4xl">🔎</div>
              <h3 className="mt-4 text-xl font-bold">No products found</h3>
              <p className="mt-2 text-sm text-gray-500">Try changing your search or filters.</p>
            </section>
          )}
        </div>
      </main>

      <style jsx>{`
        /* ================= SPLASH ================= */
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #02040a;
          transition: opacity 0.55s ease, transform 0.55s ease;
          opacity: 1;
        }
        .splash-leaving {
          opacity: 0;
          transform: scale(1.06);
          pointer-events: none;
        }
        .splash-ring {
          width: 210px;
          height: 210px;
          border-radius: 50%;
          border: 1px solid rgba(0, 188, 229, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: splash-pulse 1.8s ease-in-out infinite;
        }
        .splash-ring::before {
          content: "";
          position: absolute;
          inset: -18px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 188, 229, 0.28), transparent 70%);
          filter: blur(8px);
        }
        .splash-core {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: #05070d;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 25px rgba(0, 188, 229, 0.18);
          animation: splash-fade-in 0.6s ease;
        }
        .splash-text {
          font-size: 38px;
          font-weight: 800;
          color: white;
          letter-spacing: 1px;
          text-shadow: 0 0 18px rgba(0, 188, 229, 0.85);
        }
        @keyframes splash-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 188, 229, 0.25); }
          50% { box-shadow: 0 0 0 20px rgba(0, 188, 229, 0); }
        }
        @keyframes splash-fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        /* ================= STORE ORBIT LOADER ================= */
        .loader-card {
          --acc: 34, 211, 238; /* cyan. Change to "248, 81, 73" for the red look */
        }
        .orbit-wrap {
          position: relative;
          width: 300px;
          height: 300px;
          margin-left: auto;
          margin-right: auto;
        }
        .ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .ring-outer {
          width: 236px;
          height: 236px;
          border: 1px dashed rgba(var(--acc), 0.35);
          animation: ring-breathe 3s ease-in-out infinite;
        }
        .ring-inner {
          width: 190px;
          height: 190px;
          border: 1px solid rgba(var(--acc), 0.14);
        }

        /* the whole group spins; each tile spins back so text stays upright */
        .orbit {
          position: absolute;
          inset: 0;
          animation: orbit-spin 9s linear infinite;
        }
        .slot {
          position: absolute;
          width: 0;
          height: 0;
        }
        .counter {
          position: absolute;
          left: 0;
          top: 0;
          width: 0;
          height: 0;
          animation: orbit-unspin 9s linear infinite;
        }
        .tile {
          position: absolute;
          left: 0;
          top: 0;
          transform: translate(-50%, -50%);
          min-width: 96px;
          height: 52px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          border: 1.5px solid rgba(var(--acc), 0.5);
          background: #0b0f1c;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2px;
          white-space: nowrap;
          overflow: hidden;
        }
        .tile::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 100% 0%, rgba(var(--acc), 0.45), transparent 60%);
          pointer-events: none;
        }
        .tile span {
          position: relative;
        }
        .tile-active {
          border-color: rgba(var(--acc), 1);
          box-shadow: 0 0 22px rgba(var(--acc), 0.45);
          animation: tile-pop 0.45s ease-out;
        }
        .status-name {
          display: inline-block;
          animation: status-in 0.35s ease-out;
        }

        @keyframes orbit-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-unspin {
          to { transform: rotate(-360deg); }
        }
        @keyframes ring-breathe {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes tile-pop {
          0% { transform: translate(-50%, -50%) scale(0.75); opacity: 0.3; }
          60% { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes status-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ================= SUCCESS ================= */
        .ok-ring-outer {
          width: 236px;
          height: 236px;
          border: 1px dashed rgba(74, 222, 128, 0.55);
          animation: ok-ring-spin 12s linear infinite;
        }
        .ok-ring-inner {
          width: 170px;
          height: 170px;
          border: 1px solid rgba(74, 222, 128, 0.22);
        }
        .ok-tile {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 84px;
          height: 84px;
          margin: -42px 0 0 -42px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #22c55e, #16a34a);
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.55);
          animation: ok-pop 0.55s cubic-bezier(0.2, 1.4, 0.4, 1);
        }
        .ok-check {
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: ok-draw 0.45s 0.25s ease-out forwards;
        }
        .ok-title {
          animation: status-in 0.4s ease-out;
        }
        .confetti {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 2px;
          opacity: 0;
          animation: confetti-burst 1.2s ease-out forwards;
        }
        @keyframes ok-ring-spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ok-pop {
          from { transform: scale(0.3); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes ok-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes confetti-burst {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(320deg); }
        }
      `}</style>
    </>
  );
}