"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Think<span className="text-cyan-400">Sync</span>
          </h1>

          <p className="text-gray-400 mt-2 text-sm">
            Your intelligent student workspace
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl">

          <div className="mb-7">
            <h2 className="text-2xl font-semibold">
              Create your account
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Start your ThinkSync journey today.
            </p>
          </div>

          {/* Name */}
          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">
              Full name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">
              Password
            </label>

            <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 pr-20 text-white placeholder-gray-600 outline-none focus:border-cyan-400 transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>

            </div>
          </div>

          {/* Register Button */}
          <button
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-semibold rounded-xl py-3 transition"
          >
            Create Account
          </button>

          {/* Login */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Login
            </Link>
          </p>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          © 2026 ThinkSync. All rights reserved.
        </p>

      </div>

    </main>
  );
}