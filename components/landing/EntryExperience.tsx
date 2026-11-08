"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  BookOpen,
  ShoppingBag,
  Wallet,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import Hero from "./Hero";

/* ===============================================================
   DESIGN TOKENS
   One coherent triad (violet → cyan → fuchsia) instead of five
   competing hues. Everything derives opacity from a base color,
   so glow strength stays consistent instead of string-hacked.
================================================================ */

type ModuleData = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  position: string;
  delay: number;
};

const modules: ModuleData[] = [
  {
    title: "StudyBuddy",
    subtitle: "Learn smarter",
    icon: <BookOpen size={22} strokeWidth={1.75} />,
    color: "139,92,246", // violet
    position: "left-[3%] top-[38%]",
    delay: 0,
  },
  {
    title: "Expense Tracker",
    subtitle: "Spend wisely",
    icon: <Wallet size={22} strokeWidth={1.75} />,
    color: "245,158,11", // amber
    position: "right-[3%] top-[38%]",
    delay: 0.15,
  },
  {
    title: "AI Shopping",
    subtitle: "Choose better",
    icon: <ShoppingBag size={22} strokeWidth={1.75} />,
    color: "236,72,153", // fuchsia
    position: "left-1/2 top-[4%]",
    delay: 0.3,
  },
];

export default function EntryExperience() {
  const [launching, setLaunching] = useState(false);
  const [entered, setEntered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 22 });

  const rotateX = useTransform(smoothY, [-500, 500], [6, -6]);
  const rotateY = useTransform(smoothX, [-500, 500], [-6, 6]);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (prefersReducedMotion) return;
    mouseX.set(event.clientX - window.innerWidth / 2);
    mouseY.set(event.clientY - window.innerHeight / 2);
  };

  const launch = () => {
    if (launching) return;
    setLaunching(true);
    setTimeout(() => setEntered(true), prefersReducedMotion ? 400 : 1900);
  };

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <motion.main
          key="entry"
          onMouseMove={handleMouseMove}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.15, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050408] text-white"
        >
          {/* =====================================================
              AURORA BACKGROUND — slower, fewer blobs, one palette
          ====================================================== */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={
                prefersReducedMotion
                  ? {}
                  : { x: [-80, 90, -80], y: [-30, 60, -30] }
              }
              transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[12%] top-[8%] h-[520px] w-[520px] rounded-full bg-violet-600/[0.14] blur-[170px]"
            />
            <motion.div
              animate={
                prefersReducedMotion
                  ? {}
                  : { x: [70, -80, 70], y: [10, -60, 10] }
              }
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[8%] top-[18%] h-[460px] w-[460px] rounded-full bg-cyan-500/[0.10] blur-[170px]"
            />
            <motion.div
              animate={
                prefersReducedMotion ? {} : { x: [-40, 70, -40], y: [60, -20, 60] }
              }
              transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[-15%] left-[30%] h-[520px] w-[520px] rounded-full bg-fuchsia-600/[0.09] blur-[180px]"
            />

            {/* faint grid, fades toward the edges */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
                backgroundSize: "72px 72px",
                maskImage:
                  "radial-gradient(circle at center, black, transparent 75%)",
              }}
            />

            {/* vignette to keep focus centered */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, transparent 35%, #050408 85%)",
              }}
            />
          </div>

          <Particles launching={launching} reduced={!!prefersReducedMotion} />

          {/* =====================================================
              CENTRAL 3D SYSTEM
          ====================================================== */}
          <motion.div
            style={{
              rotateX: prefersReducedMotion ? 0 : rotateX,
              rotateY: prefersReducedMotion ? 0 : rotateY,
              transformStyle: "preserve-3d",
              perspective: 1600,
            }}
            animate={launching ? { scale: 1.2, rotateZ: 220 } : {}}
            transition={
              launching ? { duration: 1.5, ease: [0.16, 1, 0.3, 1] } : {}
            }
            className="relative z-10 h-[560px] w-[560px] sm:h-[700px] sm:w-[700px]"
          >
            <OrbitRing size="inset-[5%]" duration={26} reverse={false} launching={launching} />
            <OrbitRing size="inset-[12%]" duration={19} reverse launching={launching} />
            <OrbitRing size="inset-[20%]" duration={32} reverse={false} launching={launching} />

            <EnergyArc className="left-[4%] top-[24%]" color="139,92,246" delay={0} />
            <EnergyArc className="right-[6%] bottom-[25%]" color="236,72,153" delay={1} />
            <EnergyArc className="right-[25%] top-[5%]" color="6,182,212" delay={2} />

            {modules.map((module) => (
              <OrbitModule key={module.title} module={module} launching={launching} />
            ))}

            {/* =================================================
                CENTRAL TS CORE
            ================================================== */}
            <motion.button
              onClick={launch}
              disabled={launching}
              aria-label="Enter ThinkSync"
              className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[3.5rem] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#050408] sm:h-56 sm:w-56"
              style={{ transformStyle: "preserve-3d" }}
              animate={
                launching
                  ? { rotateY: 540, scale: 2.6 }
                  : prefersReducedMotion
                  ? {}
                  : { y: [0, -8, 0] }
              }
              transition={
                launching
                  ? { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
                  : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {/* core glow */}
              <motion.div
                animate={
                  launching
                    ? { scale: 4.5, opacity: 0 }
                    : prefersReducedMotion
                    ? { opacity: 0.35 }
                    : { scale: [0.9, 1.2, 0.9], opacity: [0.2, 0.5, 0.2] }
                }
                transition={{
                  duration: launching ? 0.9 : 3.5,
                  repeat: launching ? 0 : Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-24 rounded-full bg-gradient-to-r from-violet-600 via-cyan-400 to-fuchsia-500 blur-[65px]"
              />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-5 rounded-full border border-cyan-300/15"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 rounded-full border border-dashed border-violet-400/10"
              />

              <div className="absolute inset-0 overflow-hidden rounded-[3.5rem] border border-white/[0.14] bg-gradient-to-br from-white/[0.08] via-violet-500/[0.04] to-cyan-500/[0.03] shadow-[0_0_90px_rgba(99,102,241,0.2),inset_0_0_60px_rgba(255,255,255,0.02)] backdrop-blur-2xl">
                <motion.div
                  animate={prefersReducedMotion ? {} : { x: ["-180%", "180%"] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-y-0 w-[35%] rotate-[25deg] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent blur-md"
                />
                <div className="absolute inset-4 rounded-[3rem] bg-gradient-to-br from-violet-500/[0.07] via-transparent to-cyan-400/[0.07]" />

                <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white via-cyan-100 to-violet-300 bg-clip-text text-[72px] font-black tracking-[-0.15em] text-transparent drop-shadow-[0_0_25px_rgba(34,211,238,0.3)] sm:text-[84px]">
                  TS
                </span>

                <motion.div
                  animate={
                    prefersReducedMotion
                      ? { opacity: 0.6 }
                      : { scale: [1, 1.4, 1], opacity: [0.25, 0.8, 0.25] }
                  }
                  transition={{ duration: 2.4, repeat: Infinity }}
                  className="absolute bottom-7 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-cyan-300/80 blur-[2px]"
                />
              </div>
            </motion.button>
          </motion.div>

          {/* =====================================================
              BRAND
          ====================================================== */}
          <motion.div
            animate={{ opacity: launching ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 text-center"
          >
            <div className="flex items-center justify-center gap-2.5">
              <Sparkles size={13} className="text-cyan-400/80" strokeWidth={1.75} />
              <span className="text-xs font-medium tracking-[0.4em] text-zinc-300">
                THINKSYNC
              </span>
              <Sparkles size={13} className="text-violet-400/80" strokeWidth={1.75} />
            </div>
            <p className="mt-2.5 text-[9px] uppercase tracking-[0.45em] text-zinc-600">
              Learn · Manage · Discover
            </p>
            <motion.p
              animate={
                prefersReducedMotion ? { opacity: 0.6 } : { opacity: [0.2, 0.9, 0.2] }
              }
              transition={{ duration: 2.4, repeat: Infinity }}
              className="mt-4 text-[9px] uppercase tracking-[0.3em] text-zinc-500"
            >
              Enter the sync
            </motion.p>
          </motion.div>

          {/* =====================================================
              LAUNCH FLASH
          ====================================================== */}
          <AnimatePresence>
            {launching && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 14, opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="pointer-events-none fixed left-1/2 top-1/2 z-[100] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-2xl"
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: 11, opacity: 0 }}
                  transition={{ duration: 1.4, delay: 0.12 }}
                  className="pointer-events-none fixed left-1/2 top-1/2 z-[99] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70 bg-cyan-300/[0.15] blur-md"
                />
              </>
            )}
          </AnimatePresence>
        </motion.main>
      ) : (
        <motion.main
          key="home"
          initial={{ opacity: 0, scale: 1.06, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Hero />
        </motion.main>
      )}
    </AnimatePresence>
  );
}

/* ===============================================================
   ORBIT RING
================================================================ */

function OrbitRing({
  size,
  duration,
  reverse,
  launching,
}: {
  size: string;
  duration: number;
  reverse: boolean;
  launching: boolean;
}) {
  return (
    <motion.div
      className={`absolute ${size} rounded-full border border-white/[0.05]`}
      animate={
        launching
          ? { rotate: reverse ? -360 : 360, scale: 1.4, opacity: 0 }
          : { rotate: reverse ? -360 : 360 }
      }
      transition={{
        duration: launching ? 1.3 : duration,
        repeat: launching ? 0 : Infinity,
        ease: "linear",
      }}
    >
      <div
        className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full"
        style={{
          background: reverse ? "#ec4899" : "#06b6d4",
          boxShadow: reverse ? "0 0 14px #ec4899" : "0 0 14px #06b6d4",
        }}
      />
    </motion.div>
  );
}

/* ===============================================================
   ORBIT MODULE — glow derived from one rgb string, no string hacks
================================================================ */

function OrbitModule({
  module,
  launching,
}: {
  module: ModuleData;
  launching: boolean;
}) {
  const solid = `rgb(${module.color})`;
  const soft = `rgba(${module.color},0.16)`;
  const glow = `rgba(${module.color},0.35)`;

  return (
    <motion.div
      className={`absolute ${module.position} -translate-y-1/2`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={
        launching
          ? { opacity: 0, scale: 1.4 }
          : { opacity: 1, scale: 1, y: [0, -7, 0] }
      }
      transition={{
        opacity: { duration: 0.7, delay: module.delay },
        scale: { duration: 0.7, delay: module.delay },
        y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        whileHover={{ scale: 1.06, y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group relative flex w-48 items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.16]"
      >
        <div
          className="absolute -inset-10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: soft }}
        />

        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
          style={{ color: solid, boxShadow: `0 0 22px ${glow}` }}
        >
          {module.icon}
        </div>

        <div className="relative text-left">
          <p className="text-xs font-semibold text-white">{module.title}</p>
          <p className="mt-1 text-[10px] text-zinc-500">{module.subtitle}</p>
        </div>

        <ArrowUpRight
          size={13}
          strokeWidth={1.75}
          className="relative ml-auto text-zinc-700 transition-colors duration-300 group-hover:text-white"
        />
      </motion.div>
    </motion.div>
  );
}

/* ===============================================================
   ENERGY ARC
================================================================ */

function EnergyArc({
  className,
  color,
  delay,
}: {
  className: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className={`absolute h-[2px] w-20 rounded-full ${className}`}
      style={{
        background: `linear-gradient(90deg, transparent, rgb(${color}), transparent)`,
        boxShadow: `0 0 14px rgba(${color},0.6)`,
      }}
      animate={{ opacity: [0, 1, 0], scaleX: [0.2, 1.4, 0.2] }}
      transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

/* ===============================================================
   PARTICLES — fewer, calmer, respects reduced motion
================================================================ */

function Particles({
  launching,
  reduced,
}: {
  launching: boolean;
  reduced: boolean;
}) {
  const count = reduced ? 0 : 42;
  const particles = Array.from({ length: count });
  const colors = ["bg-cyan-300/70", "bg-violet-300/70", "bg-fuchsia-300/60", "bg-white/60"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, index) => (
        <motion.div
          key={index}
          className={`absolute h-[2px] w-[2px] rounded-full ${colors[index % colors.length]}`}
          style={{ left: `${(index * 53) % 100}%`, top: `${(index * 67) % 100}%` }}
          animate={
            launching
              ? { left: "50%", top: "50%", scale: [1, 4, 0], opacity: [0.7, 1, 0] }
              : {
                  y: [0, -12 - (index % 5) * 7, 0],
                  x: [0, (index % 3) * 6, 0],
                  opacity: [0.08, 0.6, 0.08],
                  scale: [0.5, 1, 0.5],
                }
          }
          transition={{
            duration: launching ? 1.1 : 4 + (index % 6),
            repeat: launching ? 0 : Infinity,
            delay: index * 0.035,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
