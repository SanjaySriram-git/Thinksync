"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Mascot from "@/components/common/Mascot";

const modules = [
  { name: "StudyBuddy", copy: "Learn smarter with an AI study companion.", href: "/study" },
  { name: "Expense Tracker", copy: "Track spending and stay within your budget.", href: "/expense" },
  { name: "AI Shopping", copy: "Make better choices before you buy.", href: "/ai-shopping" },
];

const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

// tints of teal, off-white, slate — for the mouse-reactive hero gradient
const COLS = [[207, 236, 249], [248, 250, 252], [226, 232, 240]];
const ZONES = [
  { name: "StudyBuddy", e: ["📚", "⏱️", "✏️", "🧠", "💡", "✅"] },
  { name: "Expense Tracker", e: ["💰", "🧾", "📊", "🪙", "💸"] },
  { name: "AI Shopping", e: ["🛍️", "🏷️", "✨", "⭐", "🛒"] },
];

type Metrics = {
  studyProgress: number;
  hasSubjects: boolean;
  todayExpenses: number;
  monthlyBudget: number;
  currencySymbol: string;
  focusStreak: number;
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// consecutive days ending today (or yesterday, if today isn't logged yet)
function computeStreak(dateStrings: string[]): number {
  const daySet = new Set(dateStrings);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!daySet.has(cursor.toISOString().split("T")[0])) cursor.setDate(cursor.getDate() - 1);
  while (daySet.has(cursor.toISOString().split("T")[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function loadExpenseMetrics() {
  try {
    const rawTx = localStorage.getItem("thinksync-expense-transactions");
    const rawBudgets = localStorage.getItem("thinksync-expense-budgets");
    const rawCurrency = localStorage.getItem("thinksync-expense-currency");
    const transactions: any[] = rawTx ? JSON.parse(rawTx) : [];
    const budgets: any[] = rawBudgets ? JSON.parse(rawBudgets) : [];
    const currencyCode = rawCurrency && CURRENCY_SYMBOLS[rawCurrency] ? rawCurrency : "INR";
    const today = todayStr();
    const todayExpenses = transactions
      .filter((t) => t.type === "expense" && t.date === today)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const monthlyBudget = budgets.reduce((sum: number, b: any) => sum + (Number(b.limit) || 0), 0);
    return { todayExpenses, monthlyBudget, currencySymbol: CURRENCY_SYMBOLS[currencyCode] };
  } catch {
    return { todayExpenses: 0, monthlyBudget: 0, currencySymbol: "₹" };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [curtainGone, setCurtainGone] = useState(false);
  const [mood, setMood] = useState<"idle" | "happy">("idle");
  const [metrics, setMetrics] = useState<Metrics>({
    studyProgress: 0, hasSubjects: false, todayExpenses: 0, monthlyBudget: 0, currencySymbol: "₹", focusStreak: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const rootRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const ptrRef = useRef<SVGSVGElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);
  const xyRef = useRef<HTMLSpanElement>(null);
  const clkRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);

  // ---------- data (unchanged logic) ----------
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login");

      setName(user.user_metadata.full_name || user.email?.split("@")[0] || "Student");
      setCheckingSession(false);

      const { data: subjects } = await supabase.from("subjects").select("progress").eq("user_id", user.id);
      const studyProgress =
        subjects && subjects.length > 0
          ? Math.round(subjects.reduce((sum, s) => sum + (s.progress ?? 0), 0) / subjects.length)
          : 0;

      const { data: sessions } = await supabase
        .from("study_sessions").select("session_date").eq("user_id", user.id).eq("completed", true);
      const focusStreak = sessions ? computeStreak(sessions.map((s) => s.session_date)) : 0;

      const { todayExpenses, monthlyBudget, currencySymbol } = loadExpenseMetrics();
      setMetrics({ studyProgress, hasSubjects: !!subjects && subjects.length > 0, todayExpenses, monthlyBudget, currencySymbol, focusStreak });
      setLoadingMetrics(false);
    };
    load();
  }, [router]);

  // ---------- entrance + mouse-reactive hero ----------
  useEffect(() => {
    if (checkingSession) return;
    const hero = heroRef.current, cv = cvRef.current, ptr = ptrRef.current;
    const cx = cv?.getContext("2d");
    if (!hero || !cv || !cx || !ptr) return;

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => { W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    window.addEventListener("resize", size);

    const zi = (x: number) => Math.max(0, Math.min(2, Math.floor((x / W) * 3)));
    const m = { x: W / 2, y: H * 0.6 }, sm = { ...m }, last = { ...m };
    let pts: { x: number; y: number; l: number; z: number }[] = [];
    let cur = [...COLS[1]];
    const letters = Array.from(hero.querySelectorAll<HTMLElement>(".hello b")).map((el) => ({ el, x: 0, y: 0 }));

    const sticker = (x: number, y: number) => {
      const s = document.createElement("span"), set = ZONES[zi(x)].e;
      s.className = "st";
      s.textContent = set[(Math.random() * set.length) | 0];
      s.style.cssText = `left:${x}px;top:${y}px;--r:${(Math.random() * 60 - 30) | 0}deg;--dx:${(Math.random() * 90 - 45) | 0}px;font-size:${(28 + Math.random() * 26) | 0}px`;
      hero.appendChild(s);
      s.onanimationend = () => s.remove();
    };

    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      m.x = e.clientX - r.left; m.y = e.clientY - r.top;
      pts.push({ x: m.x, y: m.y, l: 1, z: zi(m.x) });
      if (pts.length > 60) pts.shift();
      if (Math.hypot(m.x - last.x, m.y - last.y) > 70) { last.x = m.x; last.y = m.y; sticker(m.x, m.y); }
    };
    hero.addEventListener("pointermove", onMove);

    let raf = 0;
    const loop = () => {
      sm.x += (m.x - sm.x) * 0.2; sm.y += (m.y - sm.y) * 0.2;
      ptr.style.transform = `translate(${sm.x - 14}px,${sm.y - 14}px)`;

      const t = Math.max(0, Math.min(2, (m.x / W) * 2));
      const [a, b, f] = t < 1 ? [COLS[0], COLS[1], t] : [COLS[1], COLS[2], t - 1];
      cur = cur.map((v, i) => v + (a[i] + (b[i] - a[i]) * f - v) * 0.08);
      hero.style.setProperty("--bg", `rgb(${cur.map(Math.round).join(",")})`);

      cx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.l -= 0.018;
        if (p.l <= 0) continue;
        const c = COLS[p.z].map((v) => v * 0.8).join(","), r = 50 + 130 * p.l;
        const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.5 * p.l})`);
        g.addColorStop(0.35, `rgba(${c},${0.55 * p.l})`);
        g.addColorStop(1, `rgba(${c},0)`);
        cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, r, 0, 7); cx.fill();
      }
      pts = pts.filter((p) => p.l > 0);

      const hr = hero.getBoundingClientRect();
      for (const l of letters) {
        const r = l.el.getBoundingClientRect();
        const bx = r.left - hr.left + r.width / 2 - l.x, by = r.top - hr.top + r.height / 2 - l.y;
        const dx = m.x - bx, dy = m.y - by, d = Math.hypot(dx, dy) || 1, f2 = Math.max(0, 1 - d / 300);
        l.x += ((-dx / d) * f2 * 70 - l.x) * 0.12; l.y += ((-dy / d) * f2 * 70 - l.y) * 0.12;
        l.el.style.transform = `translate(${l.x}px,${l.y}px) rotate(${l.x * 0.12}deg)`;
      }
      if (zoneRef.current) zoneRef.current.textContent = ZONES[zi(m.x)].name;
      if (xyRef.current) xyRef.current.textContent = `X ${String(m.x | 0).padStart(4, "0")} · Y ${String(m.y | 0).padStart(4, "0")}`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    const tick = () => { if (clkRef.current) clkRef.current.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
    tick();
    const clock = setInterval(tick, 30000);

    // login entrance: curtain lifts, tagline scrambles in
    const txt = "Move your mouse. Study, spending and shopping, all in one place.";
    const ch = "!<>-_/[]{}=+*^?#";
    let scr = 0;
    const enter = setTimeout(() => {
      setCurtainGone(true);
      setTimeout(() => {
        const t0 = performance.now();
        const f = (n: number) => {
          const p = Math.min(1, (n - t0) / 1100);
          if (tagRef.current) tagRef.current.textContent = [...txt].map((c, i) => (c === " " || i < p * txt.length ? c : ch[(Math.random() * ch.length) | 0])).join("");
          if (p < 1) scr = requestAnimationFrame(f);
        };
        scr = requestAnimationFrame(f);
      }, 500);
    }, 1100);

    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(scr);
      clearInterval(clock); clearTimeout(enter);
      window.removeEventListener("resize", size);
      hero.removeEventListener("pointermove", onMove);
    };
  }, [checkingSession]);

  // ---------- scroll: sliding words, parallax icons, ring/donut reveal ----------
  useEffect(() => {
    if (checkingSession) return;
    const secs = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(".sec") ?? []);
    const onScroll = () => {
      const vh = window.innerHeight;
      secs.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        const w = s.querySelector<HTMLElement>(".word");
        if (w) w.style.transform = `translate(${(r.top / vh) * 40}vw,-50%)`;
        s.querySelectorAll<HTMLElement>(".fl").forEach((f) => { f.style.transform = `translateY(${r.top * Number(f.dataset.s)}px)`; });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) (e.target as HTMLElement).dataset.in = "1"; }), { threshold: 0.5 });
    secs.forEach((s) => io.observe(s));
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, [checkingSession]);

  if (checkingSession) return <main className="loading" style={{ minHeight: "100vh", background: "#F8FAFC" }} />;

  const fmt = (n: number) => `${metrics.currencySymbol}${n.toLocaleString("en-IN")}`;
  const val = (s: string) => (loadingMetrics ? "···" : s);
  const spendPct = metrics.monthlyBudget > 0 ? Math.min(100, Math.round((metrics.todayExpenses / metrics.monthlyBudget) * 100)) : 0;
  const ringOffset = 327 * (1 - metrics.studyProgress / 100);
  const [study, expense, shop] = modules;

  return (
    <main className="dashboard" ref={rootRef}>
      <div className={`curtain ${curtainGone ? "go" : ""}`} aria-hidden="true">Signing you in…</div>

      <header className="hero" ref={heroRef}>
        <canvas className="fx" ref={cvRef} />
        <nav>
          <a href="/dashboard" className="brand">ThinkSync</a>
          <div><a href="#study">Study</a><a href="#spend">Expenses</a><a href="#shop">Shopping</a></div>
        </nav>
        <h1 className="hello" aria-label="Hello"><b>H</b><b>e</b><b>l</b><b>l</b><b>o</b></h1>
        <div className="sub"><h2>Welcome back, {name}</h2><p ref={tagRef} /></div>
        <div className="hud"><span ref={xyRef}>X 0000 · Y 0000</span><span className="z" ref={zoneRef}>Expense Tracker</span><span ref={clkRef} /></div>
        <svg className="ptr" ref={ptrRef} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
          <circle cx="14" cy="14" r="10" fill="none" stroke="#0F172A" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="2.5" fill="#0F172A" />
        </svg>
      </header>

      <section className="metrics">
        <div><small>Study progress</small><strong>{val(`${metrics.studyProgress}%`)}</strong></div>
        <div><small>Today&apos;s expenses</small><strong>{val(fmt(metrics.todayExpenses))}</strong></div>
        <div><small>Monthly budget</small><strong>{val(fmt(metrics.monthlyBudget))}</strong></div>
        <div><small>Focus streak</small><strong>{val(`${String(metrics.focusStreak).padStart(2, "0")} days`)}</strong></div>
      </section>

      <section className="sec" id="study" style={{ background: "#CFECF9" }}>
        <div className="word">Study</div>
        <i className="fl" data-s=".25" style={{ left: "10%", top: "16%" }}>📚</i><i className="fl" data-s=".4" style={{ right: "12%", top: "22%" }}>💡</i>
        <i className="fl" data-s=".3" style={{ left: "16%", bottom: "20%" }}>✏️</i><i className="fl" data-s=".5" style={{ right: "9%", bottom: "26%" }}>✅</i>
        <div className="obj">
          <svg viewBox="0 0 120 120"><circle className="ring" cx="60" cy="60" r="52" stroke="rgba(0,0,0,.1)" /><circle className="arc" cx="60" cy="60" r="52" style={{ ["--o" as string]: ringOffset }} /></svg>
          <div className="big">{val(`${metrics.studyProgress}%`)}</div>
          <small>{metrics.hasSubjects ? "Average subject progress" : "Add a subject to start"}</small>
        </div>
        <div className="cap"><h3>{study.name}</h3><p>{study.copy}</p><a className="btn" href={study.href}>Open {study.name}</a></div>
      </section>

      <section className="sec" id="spend" style={{ background: "#F8FAFC" }}>
        <div className="word">Spend</div>
        <i className="fl" data-s=".3" style={{ left: "12%", top: "20%" }}>💰</i><i className="fl" data-s=".45" style={{ right: "10%", top: "16%" }}>🧾</i>
        <i className="fl" data-s=".25" style={{ left: "9%", bottom: "24%" }}>🪙</i><i className="fl" data-s=".5" style={{ right: "14%", bottom: "20%" }}>📊</i>
        <div className="obj">
          <svg viewBox="0 0 120 120"><circle className="ring" cx="60" cy="60" r="52" stroke="rgba(0,0,0,.1)" /><circle className="seg" cx="60" cy="60" r="52" stroke="#0F172A" style={{ ["--d" as string]: (327 * spendPct) / 100 }} /></svg>
          <div className="big">{val(fmt(metrics.todayExpenses))}</div>
          <small>{metrics.monthlyBudget > 0 ? `spent today · budget ${fmt(metrics.monthlyBudget)}` : "Set a budget to start tracking"}</small>
        </div>
        <div className="cap"><h3>{expense.name}</h3><p>{expense.copy}</p><a className="btn" href={expense.href}>Open {expense.name}</a></div>
      </section>

      <section className="sec" id="shop" style={{ background: "#E2E8F0" }}>
        <div className="word">Shop</div>
        <i className="fl" data-s=".3" style={{ left: "11%", top: "18%" }}>🛍️</i><i className="fl" data-s=".45" style={{ right: "11%", top: "24%" }}>🏷️</i>
        <i className="fl" data-s=".25" style={{ left: "15%", bottom: "22%" }}>⭐</i><i className="fl" data-s=".5" style={{ right: "8%", bottom: "18%" }}>🛒</i>
        <div className="obj">
          <div style={{ fontSize: 84, lineHeight: 1 }}>🛍️</div>
          <div className="big" style={{ marginTop: 14 }}>Buy smarter</div>
          <small>Compare options with AI</small>
        </div>
        <div className="cap"><h3>{shop.name}</h3><p>{shop.copy}</p><a className="btn" href={shop.href}>Open {shop.name}</a></div>
      </section>

      <section className="insight" id="insight">
        <Mascot variant="scene" mood={mood} />
        <div className="insight-in">
          <h2>{metrics.studyProgress >= 50 ? "Your week is on track." : "Your week is just getting started."}</h2>
          <p>
            {metrics.hasSubjects
              ? `You've completed ${metrics.studyProgress}% of your study target. `
              : "You haven't added any subjects yet. Start one to begin tracking progress. "}
            {metrics.monthlyBudget > 0
              ? metrics.todayExpenses > 0
                ? "Your spending today is being tracked against your monthly budget."
                : "No expenses logged today. Your budget is holding steady."
              : "Set a monthly budget in Expense Tracker to start tracking spend."}
          </p>
          <a href="/study" className="btn light" onMouseEnter={() => setMood("happy")} onMouseLeave={() => setMood("idle")}>
            Continue studying <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
      <footer className="page-footer"><span>ThinkSync · made for student momentum</span><span>© 2026</span></footer>

      <style jsx global>{`
        .st{position:absolute;pointer-events:none;z-index:4;animation:stpop 1.7s ease-out forwards}
        @keyframes stpop{0%{transform:translate(-50%,-50%) scale(0) rotate(0);opacity:1}18%{transform:translate(-50%,-50%) scale(1.15) rotate(var(--r))}100%{transform:translate(calc(-50% + var(--dx)),-190%) scale(.7) rotate(var(--r));opacity:0}}
      `}</style>
      <style jsx>{`
        :global(html),:global(body){overflow-x:hidden;width:100%;max-width:100vw}
        .dashboard{position:relative;overflow-x:hidden;background:#F8FAFC;color:#0F172A;font-family:Outfit,system-ui,Arial,sans-serif;max-width:100vw}
        .dashboard *{box-sizing:border-box}
        .hero,.sec{position:relative;height:100vh;min-height:560px;overflow:hidden}
        .hero{background:var(--bg,#F8FAFC)}
        @media (hover:hover){.hero{cursor:none}.ptr{display:block!important}}
        .fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
        nav{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:20px 4vw;z-index:5}
        nav div{display:flex;gap:22px;font-weight:600;font-size:14px}
        nav a{color:inherit;text-decoration:none}
        .brand{font:400 24px "DM Serif Display",Georgia,serif}
        nav a:focus-visible,.btn:focus-visible{outline:3px solid #0F172A;outline-offset:4px;border-radius:8px}
        .hello{position:absolute;left:0;right:0;top:44%;margin:0;transform:translateY(-50%);text-align:center;font:400 clamp(96px,26vw,340px)/.9 "DM Serif Display",Georgia,serif;letter-spacing:-.02em;z-index:2;pointer-events:none;user-select:none}
        .hello b{display:inline-block;font-weight:400;will-change:transform}
        .sub{position:absolute;left:0;right:0;top:66%;text-align:center;z-index:3;padding:0 20px}
        .sub h2{margin:0;font:400 clamp(22px,3.4vw,40px)/1.15 "DM Serif Display",Georgia,serif}
        .sub p{margin:8px 0 0;font-size:15px;min-height:1.4em}
        .hud{position:absolute;left:4vw;right:4vw;bottom:22px;display:flex;justify-content:space-between;align-items:flex-end;font-size:13px;z-index:5;font-variant-numeric:tabular-nums}
        .hud .z{font:400 22px "DM Serif Display",Georgia,serif}
        .ptr{position:absolute;left:0;top:0;z-index:6;pointer-events:none;display:none}
        .curtain{position:fixed;inset:0;z-index:50;background:#0F172A;color:#fff;display:grid;place-items:center;font:400 28px "DM Serif Display",Georgia,serif;transition:transform 1s cubic-bezier(.7,0,.2,1)}
        .curtain.go{transform:translateY(-101%);pointer-events:none}
        .metrics{display:grid;grid-template-columns:repeat(4,1fr);background:#F8FAFC;border-bottom:1px solid rgba(15,23,42,.15)}
        .metrics div{padding:26px 4vw;border-right:1px solid rgba(15,23,42,.15);min-width:0}
        .metrics div:last-child{border:0}
        .metrics small,.metrics strong{display:block}
        .metrics small{font-size:13px;color:#64748B}
        .metrics strong{margin-top:6px;font:400 30px "DM Serif Display",Georgia,serif}
        .sec{display:grid;place-items:center}
        .word{position:absolute;left:0;right:0;top:50%;text-align:center;font:400 clamp(110px,27vw,380px)/1 "DM Serif Display",Georgia,serif;white-space:nowrap;will-change:transform;user-select:none;transform:translate(40vw,-50%)}
        .obj{position:relative;z-index:2;width:min(300px,64vw);aspect-ratio:3/4;background:#fff;border-radius:150px;box-shadow:0 30px 40px -18px rgba(15,23,42,.18),inset 0 0 0 1px #E2E8F0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px}
        .obj svg{width:74%;transform:rotate(-90deg)}
        .obj .big{font:400 34px/1 "DM Serif Display",Georgia,serif;margin-top:-4px}
        .obj small{font-size:13px;color:#64748B;margin-top:6px}
        .ring,.seg,.arc{fill:none;stroke-width:12;stroke-linecap:round}
        .arc{stroke:#0F172A;stroke-dasharray:327;stroke-dashoffset:327;transition:stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1)}
        .sec[data-in="1"] .arc{stroke-dashoffset:var(--o)}
        .seg{stroke-dasharray:0 327;transition:stroke-dasharray 1.4s cubic-bezier(.2,.7,.2,1)}
        .sec[data-in="1"] .seg{stroke-dasharray:var(--d) 327}
        .fl{position:absolute;z-index:3;font-style:normal;font-size:clamp(34px,6vw,64px);animation:bob 4s ease-in-out infinite alternate;pointer-events:none}
        @keyframes bob{to{translate:0 -16px;rotate:8deg}}
        .cap{position:absolute;left:4vw;bottom:28px;z-index:4;max-width:min(320px,70vw)}
        .cap h3{margin:0;font:400 28px/1.1 "DM Serif Display",Georgia,serif}
        .cap p{margin:6px 0 14px;font-size:15px}
        .btn{display:inline-flex;align-items:center;gap:6px;background:#0284C7;color:#fff;text-decoration:none;padding:11px 20px;border-radius:99px;font-weight:600;font-size:14px;transition:transform .2s}
        .btn:hover{transform:scale(1.06)}
        .btn.light{background:#fff;color:#0F172A}
        .insight{position:relative;overflow:hidden;background:#0F172A;color:#fff;padding:clamp(80px,12vw,150px) 4vw}
        .insight-in{position:relative;z-index:1;max-width:620px}
        .insight h2{margin:0 0 18px;font:400 clamp(38px,6vw,84px)/1 "DM Serif Display",Georgia,serif}
        .insight p{margin:0 0 28px;line-height:1.7;color:#94A3B8;max-width:480px}
        .page-footer{display:flex;flex-wrap:wrap;gap:6px;justify-content:space-between;padding:22px 4vw;background:#0F172A;color:#64748B;font-size:12px;border-top:1px solid rgba(255,255,255,.12)}
        @media(max-width:850px){
          nav div{gap:14px;font-size:13px}
          .metrics{grid-template-columns:1fr 1fr}
          .metrics div:nth-child(2){border-right:0}
          .metrics div:nth-child(-n+2){border-bottom:1px solid rgba(15,23,42,.15)}
          .cap{bottom:20px}
        }
        @media(max-width:520px){
          .metrics strong{font-size:24px}
          .metrics div{padding:18px 20px}
          .hud .z{display:none}
          .hud{justify-content:space-between}
        }
        @media(prefers-reduced-motion:reduce){.fl{animation:none}.curtain{display:none}.arc,.seg{transition:none}}
      `}</style>
    </main>
  );
}