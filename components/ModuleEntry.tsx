"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Gift,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type ModuleType = "study" | "expense" | "shopping";

type ModuleConfig = {
  name: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
  tag: string;
};

const MODULES: Record<ModuleType, ModuleConfig> = {
  study: {
    name: "StudyBuddy",
    subtitle: "INTELLIGENT LEARNING",
    description:
      "Your personal AI companion for focused learning, smarter revision, and better study sessions.",
    icon: BookOpen,
    accent: "#31dcff",
    glow: "rgba(49,220,255,0.35)",
    tag: "LEARN",
  },

  expense: {
    name: "Expense Tracker",
    subtitle: "SMART MONEY MANAGEMENT",
    description:
      "Understand your spending, track your budget, and make better financial decisions.",
    icon: Wallet,
    accent: "#55f2bd",
    glow: "rgba(85,242,189,0.32)",
    tag: "MONEY",
  },

  shopping: {
    name: "ShopAI",
    subtitle: "INTELLIGENT SHOPPING",
    description:
      "Make smarter purchases with AI-powered product insights and better buying decisions.",
    icon: Gift,
    accent: "#b77aff",
    glow: "rgba(183,122,255,0.35)",
    tag: "SHOP",
  },
};

export default function ModuleEntry({
  type,
  onEnter,
}: {
  type: ModuleType;
  onEnter?: () => void;
}) {
  const module = MODULES[type];
  const Icon = module.icon;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    if (onEnter) {
      onEnter();
    }
  };

  return (
    <main
      className="module-entry"
      style={
        {
          "--accent": module.accent,
          "--glow": module.glow,
        } as React.CSSProperties
      }
    >
      {/* BACKGROUND */}

      <div className="background">
        <div className="nebula nebula-one" />
        <div className="nebula nebula-two" />

        <div className="stars">
          {Array.from({ length: 70 }).map((_, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: `${(i * 47) % 100}%`,
                top: `${(i * 71) % 100}%`,
                animationDelay: `${(i % 8) * 0.4}s`,
                animationDuration: `${3 + (i % 5)}s`,
              }}
            />
          ))}
        </div>

        <div className="grid" />
      </div>

      {/* TOP HEADER */}

      <header className={`topbar ${loaded ? "visible" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <span />
          </div>

          <div>
            <strong>
              THINK<span>SYNC</span>
            </strong>

            <small>INTELLIGENT STUDENT OS</small>
          </div>
        </div>

        <div className="system-status">
          <i />
          SYSTEM ONLINE
        </div>
      </header>

      {/* MAIN */}

      <section className={`content ${loaded ? "visible" : ""}`}>
        <div className="module-label">
          <span />
          THINKSYNC / MODULE {module.tag}
        </div>

        {/* SYMBOL */}

        <div className="symbol-stage">
          <div className="outer-orbit orbit-a" />
          <div className="outer-orbit orbit-b" />
          <div className="outer-orbit orbit-c" />

          <div className="energy-ring ring-one" />
          <div className="energy-ring ring-two" />

          <div className="symbol-glow" />

          <div className="symbol-container">
            <div className="symbol-inner">
              <Icon
                size={92}
                strokeWidth={1.15}
              />
            </div>
          </div>

          <div className="floating-dot dot-one" />
          <div className="floating-dot dot-two" />
          <div className="floating-dot dot-three" />
        </div>

        {/* TEXT */}

        <div className="text-content">
          <p className="eyebrow">{module.subtitle}</p>

          <h1>
            {module.name}
          </h1>

          <div className="line">
            <span />
          </div>

          <p className="description">
            {module.description}
          </p>

          <button
            type="button"
            className="enter-button"
            onClick={handleEnter}
          >
            <span>ENTER {module.name.toUpperCase()}</span>

            <span className="arrow">
              <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </section>

      {/* BOTTOM */}

      <footer className={`bottom ${loaded ? "visible" : ""}`}>
        <span>ONE INTELLIGENCE · THREE DIMENSIONS</span>

        <span>
          {module.tag} / 01
        </span>

        <span>THINKSYNC CORE</span>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .module-entry {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(20, 35, 75, 0.55),
              transparent 30%
            ),
            #02040b;
          color: white;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* =========================
           BACKGROUND
        ========================= */

        .background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .nebula {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(120px);
        }

        .nebula-one {
          left: -180px;
          top: 15%;
          background: var(--glow);
          opacity: 0.4;
        }

        .nebula-two {
          right: -180px;
          bottom: -100px;
          background: rgba(90, 60, 255, 0.16);
        }

        .stars {
          position: absolute;
          inset: 0;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: white;
          opacity: 0.3;
          animation: twinkle 4s ease-in-out infinite;
        }

        .grid {
          position: absolute;
          inset: 0;
          opacity: 0.12;
          background-image:
            linear-gradient(
              rgba(90, 150, 255, 0.25) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(90, 150, 255, 0.25) 1px,
              transparent 1px
            );
          background-size: 100px 100px;
          mask-image: radial-gradient(
            circle at center,
            black,
            transparent 75%
          );
        }

        /* =========================
           HEADER
        ========================= */

        .topbar {
          position: absolute;
          z-index: 20;
          top: 0;
          left: 0;
          right: 0;

          height: 85px;
          padding: 0 35px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom: 1px solid rgba(160, 190, 255, 0.1);

          opacity: 0;
          transform: translateY(-20px);

          transition:
            opacity 0.8s ease,
            transform 0.8s ease;
        }

        .topbar.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 35px;
          height: 35px;

          display: grid;
          place-items: center;

          border: 1px solid var(--accent);
          border-radius: 10px;

          box-shadow:
            0 0 25px var(--glow),
            inset 0 0 15px var(--glow);
        }

        .brand-mark span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
        }

        .brand strong {
          display: block;
          font-size: 14px;
          letter-spacing: -0.3px;
        }

        .brand strong span {
          color: var(--accent);
        }

        .brand small {
          display: block;
          margin-top: 3px;
          color: #68748d;
          font: 7px "Courier New", monospace;
          letter-spacing: 0.25em;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;

          padding: 8px 14px;

          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 20px;

          color: #8995ad;
          background: rgba(5, 10, 22, 0.55);

          font: 8px "Courier New", monospace;
          letter-spacing: 0.18em;
        }

        .system-status i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #49efb8;
          box-shadow: 0 0 12px #49efb8;
          animation: pulse 2s infinite;
        }

        /* =========================
           CONTENT
        ========================= */

        .content {
          position: relative;
          z-index: 5;

          min-height: 100vh;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 110px 20px 80px;

          opacity: 0;
          transform: translateY(20px);

          transition:
            opacity 1s ease 0.15s,
            transform 1s ease 0.15s;
        }

        .content.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .module-label {
          position: absolute;
          top: 115px;

          display: flex;
          align-items: center;
          gap: 9px;

          color: #78859e;
          font: 9px "Courier New", monospace;
          letter-spacing: 0.22em;
        }

        .module-label span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
        }

        /* =========================
           SYMBOL
        ========================= */

        .symbol-stage {
          position: relative;

          width: 400px;
          height: 400px;

          display: grid;
          place-items: center;
        }

        .symbol-glow {
          position: absolute;

          width: 230px;
          height: 230px;

          border-radius: 50%;

          background: var(--glow);

          filter: blur(65px);

          animation: glowPulse 4s ease-in-out infinite;
        }

        .symbol-container {
          position: relative;
          z-index: 5;

          width: 175px;
          height: 175px;

          display: grid;
          place-items: center;

          border-radius: 50%;

          background:
            radial-gradient(
              circle at 35% 30%,
              rgba(255, 255, 255, 0.12),
              rgba(5, 12, 30, 0.92) 65%
            );

          border: 1px solid rgba(190, 225, 255, 0.38);

          box-shadow:
            inset 0 0 50px var(--glow),
            0 0 40px var(--glow),
            0 0 100px rgba(40, 90, 255, 0.12);

          animation: symbolFloat 5s ease-in-out infinite;
        }

        .symbol-inner {
          width: 120px;
          height: 120px;

          display: grid;
          place-items: center;

          border-radius: 50%;

          border: 1px solid var(--accent);

          color: var(--accent);

          background: rgba(5, 12, 30, 0.6);

          box-shadow:
            inset 0 0 30px var(--glow),
            0 0 25px var(--glow);
        }

        /* =========================
           ORBITS
        ========================= */

        .outer-orbit {
          position: absolute;

          border: 1px solid rgba(160, 205, 255, 0.22);

          border-radius: 50%;
        }

        .orbit-a {
          width: 330px;
          height: 150px;
          transform: rotate(-22deg);
          animation: orbitA 12s linear infinite;
        }

        .orbit-b {
          width: 360px;
          height: 170px;
          transform: rotate(52deg);
          border-color: var(--glow);
          animation: orbitB 16s linear infinite;
        }

        .orbit-c {
          width: 285px;
          height: 285px;
          border-color: rgba(255, 255, 255, 0.08);
          animation: orbitC 22s linear infinite;
        }

        .energy-ring {
          position: absolute;

          width: 245px;
          height: 245px;

          border-radius: 50%;

          border: 1px solid var(--accent);

          opacity: 0.25;

          transform: rotateX(70deg);

          box-shadow: 0 0 20px var(--glow);
        }

        .ring-one {
          animation: ringOne 8s linear infinite;
        }

        .ring-two {
          width: 215px;
          height: 215px;
          border-color: #fff;
          opacity: 0.12;
          animation: ringTwo 11s linear infinite reverse;
        }

        /* =========================
           FLOATING DOTS
        ========================= */

        .floating-dot {
          position: absolute;
          z-index: 6;

          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: var(--accent);
          box-shadow: 0 0 18px var(--accent);
        }

        .dot-one {
          top: 45px;
          right: 80px;
          animation: dotOne 5s ease-in-out infinite;
        }

        .dot-two {
          bottom: 60px;
          left: 60px;
          width: 5px;
          height: 5px;
          animation: dotTwo 6s ease-in-out infinite;
        }

        .dot-three {
          top: 100px;
          left: 55px;
          width: 4px;
          height: 4px;
          animation: dotThree 4s ease-in-out infinite;
        }

        /* =========================
           TEXT
        ========================= */

        .text-content {
          text-align: center;
          max-width: 650px;
          margin-top: -15px;
        }

        .eyebrow {
          margin: 0 0 14px;

          color: var(--accent);

          font: 10px "Courier New", monospace;

          letter-spacing: 0.32em;
        }

        h1 {
          margin: 0;

          font-size: clamp(48px, 6vw, 82px);
          line-height: 0.9;

          letter-spacing: -0.065em;
          font-weight: 900;

          text-shadow:
            0 0 35px var(--glow);
        }

        .line {
          width: 80px;
          height: 1px;

          margin: 22px auto;

          background: var(--accent);

          box-shadow: 0 0 15px var(--accent);
        }

        .description {
          max-width: 500px;

          margin: 0 auto;

          color: #aab6cc;

          font-size: 14px;
          line-height: 1.7;
        }

        /* =========================
           BUTTON
        ========================= */

        .enter-button {
          position: relative;

          display: inline-flex;
          align-items: center;
          gap: 18px;

          margin-top: 28px;

          height: 52px;
          padding: 0 8px 0 23px;

          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 30px;

          background: rgba(10, 18, 38, 0.75);

          color: white;

          font: 10px "Courier New", monospace;
          font-weight: 700;
          letter-spacing: 0.15em;

          cursor: pointer;

          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .enter-button:hover {
          transform: translateY(-3px);

          border-color: var(--accent);

          box-shadow:
            0 10px 35px var(--glow);
        }

        .arrow {
          width: 36px;
          height: 36px;

          display: grid;
          place-items: center;

          border-radius: 50%;

          background: var(--accent);
          color: #02040b;

          transition: transform 0.3s ease;
        }

        .enter-button:hover .arrow {
          transform: translateX(4px);
        }

        /* =========================
           FOOTER
        ========================= */

        .bottom {
          position: absolute;
          z-index: 20;

          left: 35px;
          right: 35px;
          bottom: 22px;

          display: flex;
          justify-content: space-between;

          color: #4f5c75;

          font: 8px "Courier New", monospace;
          letter-spacing: 0.18em;

          opacity: 0;

          transition: opacity 1s ease 0.8s;
        }

        .bottom.visible {
          opacity: 1;
        }

        /* =========================
           ANIMATIONS
        ========================= */

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.15;
            transform: scale(1);
          }

          50% {
            opacity: 0.8;
            transform: scale(1.8);
          }
        }

        @keyframes pulse {
          50% {
            opacity: 0.35;
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.65;
          }

          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        @keyframes symbolFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes orbitA {
          from {
            transform: rotate(-22deg) rotate(0deg);
          }

          to {
            transform: rotate(-22deg) rotate(360deg);
          }
        }

        @keyframes orbitB {
          from {
            transform: rotate(52deg) rotate(360deg);
          }

          to {
            transform: rotate(52deg) rotate(0deg);
          }
        }

        @keyframes orbitC {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes ringOne {
          from {
            transform: rotateX(70deg) rotateZ(0deg);
          }

          to {
            transform: rotateX(70deg) rotateZ(360deg);
          }
        }

        @keyframes ringTwo {
          from {
            transform: rotateX(70deg) rotateZ(360deg);
          }

          to {
            transform: rotateX(70deg) rotateZ(0deg);
          }
        }

        @keyframes dotOne {
          50% {
            transform: translate(-25px, 20px);
          }
        }

        @keyframes dotTwo {
          50% {
            transform: translate(20px, -30px);
          }
        }

        @keyframes dotThree {
          50% {
            transform: translate(15px, 20px);
          }
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 700px) {
          .topbar {
            height: 70px;
            padding: 0 20px;
          }

          .system-status {
            display: none;
          }

          .module-label {
            top: 95px;
          }

          .symbol-stage {
            width: 330px;
            height: 330px;
          }

          .symbol-container {
            width: 145px;
            height: 145px;
          }

          .symbol-inner {
            width: 100px;
            height: 100px;
          }

          .symbol-inner :global(svg) {
            width: 65px;
            height: 65px;
          }

          .outer-orbit {
            transform: scale(0.82) rotate(-22deg);
          }

          .orbit-b {
            transform: scale(0.82) rotate(52deg);
          }

          .orbit-c {
            transform: scale(0.82);
          }

          h1 {
            font-size: 48px;
          }

          .description {
            padding: 0 20px;
            font-size: 13px;
          }

          .bottom {
            left: 20px;
            right: 20px;
          }

          .bottom span:nth-child(2) {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </main>
  );
}