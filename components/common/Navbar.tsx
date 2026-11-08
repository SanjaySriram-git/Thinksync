"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-xl">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-bold text-white">
            T
          </div>

          <span className="text-lg font-semibold tracking-tight text-white">
            Think<span className="text-cyan-400">Sync</span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Features
          </Link>

          <Link
            href="#how-it-works"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            How It Works
          </Link>

          <Link
            href="#about"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            About
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-zinc-300 transition hover:text-white sm:block"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Get Started

            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}