"use client";

import { useEffect, useState } from "react";

type TSPageTransitionProps = {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
};

export default function TSPageTransition({
  show,
  onComplete,
  duration = 900,
}: TSPageTransitionProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      setLeaving(false);
      return;
    }

    setVisible(true);
    setLeaving(false);

    const leaveTimer = window.setTimeout(() => {
      setLeaving(true);
    }, Math.max(0, duration - 300));

    const completeTimer = window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(completeTimer);
    };
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <>
      <div
        className={`ts-transition ${
          leaving ? "ts-transition-leaving" : ""
        }`}
        aria-hidden="true"
      >
        <div className="ts-ring ts-ring-outer" />
        <div className="ts-ring ts-ring-middle" />

        <div className="ts-core">
          <span className="ts-text">TS</span>
        </div>

        <div className="ts-glow" />
      </div>

      <style jsx>{`
        .ts-transition {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            radial-gradient(
              circle at center,
              rgba(16, 40, 60, 0.96) 0%,
              rgba(5, 8, 22, 0.98) 42%,
              #03050d 100%
            );
          animation: tsFadeIn 0.35s ease forwards;
        }

        .ts-transition-leaving {
          animation: tsFadeOut 0.3s ease forwards;
        }

        .ts-core {
          position: relative;
          z-index: 5;
          width: 110px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(5, 12, 24, 0.95);
          border: 1px solid rgba(95, 231, 255, 0.55);
          box-shadow:
            0 0 25px rgba(95, 231, 255, 0.45),
            0 0 80px rgba(95, 231, 255, 0.22),
            inset 0 0 25px rgba(95, 231, 255, 0.12);
          animation: tsCore 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }

        .ts-text {
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -3px;
          color: white;
          text-shadow:
            0 0 10px rgba(95, 231, 255, 0.9),
            0 0 30px rgba(95, 231, 255, 0.55);
          animation: tsText 0.7s ease forwards;
        }

        .ts-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          border: 1px solid rgba(95, 231, 255, 0.35);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .ts-ring-outer {
          width: 250px;
          height: 250px;
          animation: tsRingOuter 1.1s cubic-bezier(0.15, 0.8, 0.25, 1)
            forwards;
        }

        .ts-ring-middle {
          width: 175px;
          height: 175px;
          border-color: rgba(180, 120, 255, 0.35);
          animation: tsRingMiddle 0.9s cubic-bezier(0.15, 0.8, 0.25, 1)
            forwards;
        }

        .ts-glow {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(95, 231, 255, 0.18) 0%,
            rgba(95, 231, 255, 0.07) 30%,
            transparent 70%
          );
          filter: blur(8px);
          animation: tsGlow 1s ease forwards;
          pointer-events: none;
        }

        @keyframes tsFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes tsFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes tsCore {
          0% {
            transform: scale(0.15);
            opacity: 0;
          }

          45% {
            transform: scale(1.12);
            opacity: 1;
          }

          70% {
            transform: scale(0.96);
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes tsText {
          0% {
            opacity: 0;
            transform: scale(0.5);
            filter: blur(8px);
          }

          60% {
            opacity: 1;
            filter: blur(0);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes tsRingOuter {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0;
          }

          45% {
            opacity: 1;
          }

          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
        }

        @keyframes tsRingMiddle {
          0% {
            transform: translate(-50%, -50%) scale(0.15) rotate(0deg);
            opacity: 0;
          }

          100% {
            transform: translate(-50%, -50%) scale(1) rotate(180deg);
            opacity: 0.8;
          }
        }

        @keyframes tsGlow {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }

          50% {
            transform: scale(1.1);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        @media (max-width: 640px) {
          .ts-core {
            width: 88px;
            height: 88px;
          }

          .ts-text {
            font-size: 34px;
          }

          .ts-ring-outer {
            width: 200px;
            height: 200px;
          }

          .ts-ring-middle {
            width: 140px;
            height: 140px;
          }

          .ts-glow {
            width: 300px;
            height: 300px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ts-transition,
          .ts-transition *,
          .ts-transition::before,
          .ts-transition::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}