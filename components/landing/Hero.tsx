"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Wallet,
  ShoppingBag,
} from "lucide-react";

/* ===============================================================
   Same triad as EntryExperience — violet / cyan / fuchsia, amber
   for the one accent module — so the transition into Hero doesn't
   feel like landing on a different product.
================================================================ */

const modules = [
  {
    icon: <BookOpen size={20} strokeWidth={1.75} />,
    title: "StudyBuddy",
    description: "Learn faster",
    color: "139,92,246", // violet
  },
  {
    icon: <Wallet size={20} strokeWidth={1.75} />,
    title: "Expenses",
    description: "Spend smarter",
    color: "245,158,11", // amber
  },
  {
    icon: <ShoppingBag size={20} strokeWidth={1.75} />,
    title: "AI Shopping",
    description: "Choose better",
    color: "236,72,153", // fuchsia
  },
];

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const fadeUp = (delay: number, y = 20) =>
    prefersReducedMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay } }
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050408] px-6 pt-24">
      {/* Background glow — matches EntryExperience's aurora, at rest */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/[0.14] blur-[160px]" />
        <div className="absolute left-1/4 top-1/2 h-[320px] w-[320px] rounded-full bg-cyan-500/[0.08] blur-[140px]" />
        <div className="absolute right-1/4 bottom-0 h-[320px] w-[320px] rounded-full bg-fuchsia-500/[0.08] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(circle at 50% 30%, black, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <motion.div
          {...fadeUp(0)}
          className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 backdrop-blur-md"
        >
          <Sparkles size={15} className="text-cyan-400/90" strokeWidth={1.75} />
          Your AI-powered student companion
        </motion.div>

        {/* Heading */}
        <motion.h1
          {...fadeUp(0.1, 25)}
          className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Think smarter.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
            Live better.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          {...fadeUp(0.2)}
          className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg"
        >
          ThinkSync brings studying, personal finance, and intelligent
          shopping together in one AI-powered platform built for students.
        </motion.p>

        {/* Buttons */}
        <motion.div
          {...fadeUp(0.3)}
          className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-black transition duration-300 hover:scale-[1.02] hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050408]"
          >
            Start for free
            <ArrowRight
              size={17}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>

          <Link
            href="#features"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 font-medium text-white backdrop-blur-md transition duration-300 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050408]"
          >
            Explore ThinkSync
          </Link>
        </motion.div>

        {/* Three modules */}
        <motion.div
          {...fadeUp(0.45, 30)}
          className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {modules.map((module) => (
            <Module key={module.title} {...module} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Module({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const solid = `rgb(${color})`;
  const soft = `rgba(${color},0.14)`;
  const glow = `rgba(${color},0.3)`;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16]">
      <div
        className="absolute -inset-10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: soft }}
      />

      <div
        className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]"
        style={{ color: solid, boxShadow: `0 0 20px ${glow}` }}
      >
        {icon}
      </div>

      <h3 className="relative font-semibold text-white">{title}</h3>
      <p className="relative mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  );
}
