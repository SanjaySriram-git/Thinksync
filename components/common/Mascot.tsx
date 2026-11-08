"use client";

import { useEffect, useId, useRef, useState } from "react";

/*
  Layered mascot — nothing is baked together any more.

  public/mascot/
    body.png        the character with both irises removed (eye whites + lids stay)
    iris-left.png   left iris + pupil + highlights   (its own layer, moves)
    iris-right.png  right iris + pupil + highlights  (its own layer, moves)
    blink-eyes.png  closed eyes for a quick blink
    happy-eyes.png  closed "^ ^" smiling eyes

  All layers share one 720x720 coordinate space, so they line up at any size.
  Each iris is clipped to its eye opening, so it can never leave the eye.
*/

type MascotMood = "idle" | "happy";
type MascotVariant = "floating" | "scene";

const SIZE = 720;

const EYES = {
  left: {
    x: 290, y: 222, w: 67, h: 66,
    clip: "M312 218 L300 228 L296 232 L292 240 L290 246 L290 262 L294 270 L300 278 L308 282 L310 282 L320 284 L324 284 L326 286 L344 286 L350 282 L362 260 L362 242 L358 232 L352 226 L346 222 L340 220 L326 218 L326 218 L316 218 Z",
  },
  right: {
    x: 424, y: 257, w: 58, h: 59,
    clip: "M482 252 L478 250 L460 250 L460 250 L456 250 L446 256 L438 264 L434 270 L428 284 L428 296 L430 296 L430 300 L436 308 L446 312 L468 312 L476 308 L480 308 L482 306 L490 294 L494 276 L492 266 L488 258 Z",
  },
} as const;

// floating = head-and-shoulders crop (eyes stay readable when tiny), scene = full body
const VIEWBOX: Record<MascotVariant, string> = {
  floating: "140 0 480 480",
  scene: `0 0 ${SIZE} ${SIZE}`,
};

// how far the irises may travel, in source pixels (720 space)
const RANGE = { left: 3.5, right: 6, up: 4, down: 2.5 };

export default function Mascot({
  mood = "idle",
  variant = "floating",
  gain = 1,
  assetPath = "/mascot",
}: {
  mood?: MascotMood;
  variant?: MascotVariant;
  /** 1 = default eye travel, 1.4 = more expressive, 0.6 = subtle */
  gain?: number;
  assetPath?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const irisL = useRef<SVGImageElement>(null);
  const irisR = useRef<SVGImageElement>(null);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const moodRef = useRef<MascotMood>(mood);
  const [blinking, setBlinking] = useState(false);

  moodRef.current = mood;

  // ---------- cursor tracking ----------
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reach = variant === "scene" ? 650 : 420; // px until the eyes are fully turned
    const maxTilt = variant === "scene" ? 5 : 9;

    const apply = () => {
      const { x, y } = current.current;
      const dx = (x < 0 ? x * RANGE.left : x * RANGE.right) * gain;
      const dy = (y < 0 ? y * RANGE.up : y * RANGE.down) * gain;
      const t = `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`;
      irisL.current?.setAttribute("transform", t);
      irisR.current?.setAttribute("transform", t);

      if (faceRef.current) {
        const k = moodRef.current === "happy" ? 0 : 1;
        faceRef.current.style.transform = `rotateX(${(-y * maxTilt * 0.5 * k).toFixed(2)}deg) rotateY(${(x * maxTilt * k).toFixed(2)}deg)`;
      }
    };

    const tick = () => {
      const k = 0.16;
      current.current.x += (target.current.x - current.current.x) * k;
      current.current.y += (target.current.y - current.current.y) * k;
      apply();
      const settled =
        Math.abs(target.current.x - current.current.x) < 0.002 &&
        Math.abs(target.current.y - current.current.y) < 0.002;
      raf.current = settled ? null : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (raf.current === null) raf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (!fine.matches || reduce.matches || !wrapRef.current) return;
      const box = wrapRef.current.getBoundingClientRect();
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      target.current = {
        x: Math.max(-1, Math.min(1, dx / reach)),
        y: Math.max(-1, Math.min(1, dy / reach)),
      };
      wake();
    };
    const onLeave = () => {
      target.current = { x: 0, y: 0 };
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [variant, gain]);

  // keep the head level while happy; tracking resumes smoothly on the next mouse move
  useEffect(() => {
    if (faceRef.current && mood === "happy") faceRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  }, [mood]);

  // ---------- blinking ----------
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t1 = setTimeout(() => {
        if (moodRef.current === "idle") {
          setBlinking(true);
          t2 = setTimeout(() => setBlinking(false), 120);
        }
        schedule();
      }, 2600 + Math.random() * 3200);
    };
    schedule();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const clipL = `${uid}-clip-l`;
  const clipR = `${uid}-clip-r`;

  return (
    <div ref={wrapRef} className={`mascot ${variant} ${mood}${blinking ? " blinking" : ""}`} aria-hidden="true">
      <div className="orbit-glow" />
      {mood === "happy" && (
        <>
          <span className="spark s1">✦</span>
          <span className="spark s2">✦</span>
          <span className="spark s3">✦</span>
        </>
      )}

      <div className="bounce">
        <div ref={faceRef} className="face">
          <svg viewBox={VIEWBOX[variant]} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <clipPath id={clipL}>
                <path d={EYES.left.clip} />
              </clipPath>
              <clipPath id={clipR}>
                <path d={EYES.right.clip} />
              </clipPath>
            </defs>

            {/* 1. body — no irises, just eye whites and lids */}
            <image href={`${assetPath}/body.png`} x={0} y={0} width={SIZE} height={SIZE} preserveAspectRatio="none" />

            {/* 2. irises — separate layers, each clipped to its own eye opening */}
            <g className="irises" clipPath={`url(#${clipL})`}>
              <image ref={irisL} href={`${assetPath}/iris-left.png`} x={EYES.left.x} y={EYES.left.y} width={EYES.left.w} height={EYES.left.h} preserveAspectRatio="none" />
            </g>
            <g className="irises" clipPath={`url(#${clipR})`}>
              <image ref={irisR} href={`${assetPath}/iris-right.png`} x={EYES.right.x} y={EYES.right.y} width={EYES.right.w} height={EYES.right.h} preserveAspectRatio="none" />
            </g>

            {/* 3. eyelids — quick blink, and the happy ^ ^ eyes */}
            <image className="lids blink" href={`${assetPath}/blink-eyes.png`} x={0} y={0} width={SIZE} height={SIZE} preserveAspectRatio="none" />
            <image className="lids happy-eyes" href={`${assetPath}/happy-eyes.png`} x={0} y={0} width={SIZE} height={SIZE} preserveAspectRatio="none" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        .mascot {
          pointer-events: none;
          perspective: 900px;
        }

        /* ---------- floating: small, fixed bottom-right ---------- */
        .mascot.floating {
          position: fixed;
          right: clamp(16px, 3vw, 36px);
          bottom: clamp(16px, 3vw, 36px);
          z-index: 50;
          width: clamp(96px, 10vw, 140px);
          height: clamp(96px, 10vw, 140px);
        }
        .mascot.floating .face {
          border-radius: 50%;
          border: 1px solid rgba(151, 223, 255, 0.55);
          box-shadow: 0 12px 30px rgba(5, 9, 25, 0.5), 0 0 28px rgba(33, 166, 255, 0.35);
          background: #fdf6ec;
        }

        /* ---------- scene: large, sits inside a section ---------- */
        .mascot.scene {
          position: absolute;
          top: clamp(-40px, -4vw, 0px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 0;
          width: clamp(280px, 34vw, 520px);
          height: clamp(280px, 34vw, 520px);
        }
        .mascot.scene .orbit-glow {
          inset: 6%;
          opacity: 0.5;
        }

        /* ---------- shared ---------- */
        .orbit-glow {
          position: absolute;
          inset: -14%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(72, 221, 255, 0.35), transparent 70%);
          filter: blur(10px);
          opacity: 0.6;
          transition: opacity 0.3s;
        }
        .mascot.happy .orbit-glow {
          opacity: 1;
          animation: pulse 1s ease-in-out infinite;
        }
        .bounce,
        .face {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .mascot.happy .bounce {
          animation: bounce 0.55s ease-in-out infinite;
        }
        .face {
          overflow: hidden;
          transform-style: preserve-3d;
          transition: transform 0.18s ease-out;
          will-change: transform;
        }
        svg {
          display: block;
        }

        /* eye layers */
        .irises {
          opacity: 1;
          transition: opacity 0.12s ease;
        }
        .lids {
          opacity: 0;
          transition: opacity 0.18s ease;
        }
        .mascot.blinking .lids.blink {
          opacity: 1;
          transition: none;
        }
        .mascot.happy .lids.happy-eyes {
          opacity: 1;
        }
        .mascot.happy .irises {
          opacity: 0;
        }

        .spark {
          position: absolute;
          z-index: 2;
          color: #ffd76b;
          font-size: 16px;
          text-shadow: 0 0 8px rgba(255, 215, 107, 0.8);
          animation: sparkle 1s ease-in-out infinite;
        }
        .mascot.scene .spark {
          font-size: clamp(18px, 2.4vw, 30px);
        }
        .s1 {
          top: -6px;
          left: -4px;
        }
        .s2 {
          top: 4px;
          right: -10px;
          animation-delay: 0.2s;
        }
        .s3 {
          bottom: -8px;
          left: 30%;
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0) scale(1, 1);
          }
          30% {
            transform: translateY(-10px) scale(1.04, 0.96);
          }
          60% {
            transform: translateY(2px) scale(0.97, 1.05);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.12);
          }
        }
        @keyframes sparkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.4) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(25deg);
          }
        }

        @media (max-width: 850px) {
          .mascot.floating {
            display: none;
          }
          .mascot.scene {
            width: clamp(200px, 55vw, 320px);
            height: clamp(200px, 55vw, 320px);
            top: -20px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bounce,
          .orbit-glow,
          .spark {
            animation: none !important;
          }
          .face,
          .lids,
          .irises {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}