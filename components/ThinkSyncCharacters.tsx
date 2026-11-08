"use client";

import { useEffect, useState } from "react";

type ThinkSyncCharactersProps = {
  /** true while the password field has focus */
  passwordFocused?: boolean;
  /** true once the eye icon has toggled the password to plain text */
  passwordVisible?: boolean;
};

type EyeState = "open" | "closed" | "happy";

export default function ThinkSyncCharacters({
  passwordFocused = false,
  passwordVisible = false,
}: ThinkSyncCharactersProps) {
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const x =
        (event.clientX / window.innerWidth - 0.5) * 2;

      const y =
        (event.clientY / window.innerHeight - 0.5) * 2;

      setMouse({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const eyeX = mouse.x * 6;
  const eyeY = mouse.y * 3;

  /* ============================================================
     ONLY TWO INPUTS DECIDE THE FACE -- on purpose.
     The previous version also required a "passwordHasValue"
     prop; if a parent forgot to pass it, the face could never
     leave "open" no matter what the user did. Keeping this to
     two booleans (one of which -- passwordFocused -- almost
     certainly already existed in your form) makes it much
     harder to end up silently stuck.
  ============================================================ */

  const eyeState: EyeState =
    passwordFocused && passwordVisible
      ? "happy" // password field focused AND revealed -> peeking/laughing
      : passwordFocused && !passwordVisible
      ? "closed" // password field focused AND masked -> eyes shut
      : "open"; // anything else (idle, or typing email) -> normal

  return (
    <div className={`thinksync-characters state-${eyeState}`}>
      {/* =====================================================
          ORANGE CHARACTER
      ===================================================== */}

      <div
        className="character orange-character"
        style={{
          transform: `translate(${mouse.x * 9}px, ${mouse.y * 4}px)`,
        }}
      >
        <div className="eyebrow orange-brow" />

        <div className="character-eyes">
          <Eye state={eyeState} x={eyeX} y={eyeY} size={11} />
          <Eye state={eyeState} x={eyeX} y={eyeY} size={11} />
        </div>

        <div className="character-mouth orange-mouth" />
      </div>

      {/* =====================================================
          PURPLE CHARACTER
      ===================================================== */}

      <div
        className="character purple-character"
        style={{
          transform: `
            translate(${mouse.x * -5}px, ${mouse.y * 5}px)
            rotate(${mouse.x * 3}deg)
          `,
        }}
      >
        <div className="eyebrow purple-brow" />

        <div className="character-eyes" style={{ gap: "12px" }}>
          <Eye state={eyeState} x={eyeX} y={eyeY} size={9} />
          <Eye state={eyeState} x={eyeX} y={eyeY} size={9} />
        </div>

        <div className="character-mouth purple-mouth" />
      </div>

      {/* =====================================================
          BLACK CHARACTER
      ===================================================== */}

      <div
        className="character black-character"
        style={{
          transform: `
            translate(${mouse.x * 10}px, ${mouse.y * 6}px)
            rotate(${mouse.x * -4}deg)
          `,
        }}
      >
        <div className="eyebrow black-brow" />

        <div className="character-eyes" style={{ gap: "12px" }}>
          <Eye state={eyeState} x={eyeX} y={eyeY} size={11} />
          <Eye state={eyeState} x={eyeX} y={eyeY} size={11} />
        </div>

        <div className="character-mouth black-mouth" />
      </div>

      {/* =====================================================
          YELLOW CHARACTER (profile face, single eye)
      ===================================================== */}

      <div
        className="character yellow-character"
        style={{
          transform: `
            translate(${mouse.x * 7}px, ${mouse.y * 5}px)
            rotate(${mouse.x * 2}deg)
          `,
        }}
      >
        <div className="eyebrow yellow-brow" />

        <div className="character-eyes single-eye">
          <Eye state={eyeState} x={eyeX} y={eyeY} size={11} />
        </div>

        <div className="character-mouth yellow-mouth" />
      </div>

      <style jsx global>{`
        /* =====================================================
           EYE -- all three visual states live here, in ONE
           always-mounted style block (nothing conditional),
           so nothing can be silently dropped mid-transition.
        ===================================================== */

        .eye {
          position: relative;

          display: inline-block;

          border-radius: 50%;

          transition:
            width 0.2s ease,
            height 0.2s ease,
            transform 0.12s ease-out,
            background 0.2s ease,
            border 0.2s ease;
        }

        .eye-open {
          background: white;

          box-shadow: 0 2px 7px rgba(0, 0, 0, 0.35);

          overflow: hidden;
        }

        .eye-open .pupil {
          position: absolute;

          left: 50%;
          top: 50%;

          width: 55%;
          height: 62%;

          transform: translate(-50%, -50%);

          border-radius: 50%;

          background: #050505;
        }

        .eye-closed {
          background: #050505;

          border-radius: 3px;

          box-shadow: none;
        }

        .eye-happy {
          background: transparent;

          border-top: 3px solid #050505;

          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        }
      `}</style>

      <style jsx>{`

        /* =====================================================
           CHARACTER CONTAINER
        ===================================================== */

        .thinksync-characters {
          position: absolute;

          left: 50%;
          bottom: 0;

          width: 340px;
          height: 190px;

          transform: translateX(-50%);

          z-index: 25;

          pointer-events: none;

          transform-origin: bottom center;
        }

        /* =====================================================
           COMMON CHARACTER
        ===================================================== */

        .character {
          position: absolute;

          bottom: 0;

          transform-origin: bottom center;

          transition:
            transform 0.22s
            cubic-bezier(0.16, 1, 0.3, 1);

          filter:
            drop-shadow(0 15px 18px rgba(0, 0, 0, 0.45));
        }

        /* small overall "flinch" reaction -- characters stay
           facing forward the whole time, they just duck a
           little when eyes shut, and perk up when happy */
        .state-closed .character {
          transform: translateY(3px) !important;
        }

        .state-happy .character {
          transform: translateY(-2px) !important;
        }

        /* =====================================================
           ORANGE
        ===================================================== */

        .orange-character {
          left: 0;

          width: 130px;
          height: 82px;

          border-radius: 95px 95px 0 0;

          background: linear-gradient(145deg, #ff984b, #ff641d);

          animation: orangeFloat 4s ease-in-out infinite;

          z-index: 2;
        }

        /* =====================================================
           PURPLE
        ===================================================== */

        .purple-character {
          left: 78px;

          width: 95px;
          height: 155px;

          border-radius: 10px 10px 3px 3px;

          background: linear-gradient(145deg, #813dff, #5c20df);

          animation: purpleFloat 5s ease-in-out infinite;

          z-index: 4;
        }

        /* =====================================================
           BLACK
        ===================================================== */

        .black-character {
          left: 158px;

          width: 70px;
          height: 145px;

          border-radius: 9px 9px 3px 3px;

          background: linear-gradient(145deg, #171922, #05060b);

          animation: blackFloat 4.5s ease-in-out infinite;

          z-index: 5;
        }

        /* =====================================================
           YELLOW
        ===================================================== */

        .yellow-character {
          right: 8px;

          width: 88px;
          height: 112px;

          border-radius: 65px 65px 0 0;

          background: linear-gradient(145deg, #ffe842, #f5c800);

          animation: yellowFloat 4.2s ease-in-out infinite;

          z-index: 3;
        }

        /* =====================================================
           EYES AREA
        ===================================================== */

        .character-eyes {
          position: absolute;

          top: 24px;
          left: 50%;

          transform: translateX(-50%);

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 12px;

          z-index: 10;
        }

        .single-eye {
          left: 42%;
        }

        /* =====================================================
           EYEBROWS
        ===================================================== */

        .eyebrow {
          position: absolute;

          width: 20px;
          height: 4px;

          border-radius: 10px;

          background: rgba(20, 15, 10, 0.65);

          z-index: 12;

          transition:
            transform 0.3s ease,
            opacity 0.3s ease;
        }

        .orange-brow {
          left: 52px;
          top: 25px;

          transform: rotate(-10deg);
        }

        .purple-brow {
          left: 40px;
          top: 15px;

          background: rgba(255, 255, 255, 0.75);

          transform: rotate(-7deg);
        }

        .black-brow {
          left: 27px;
          top: 15px;

          background: rgba(255, 255, 255, 0.65);

          transform: rotate(7deg);
        }

        .yellow-brow {
          left: 38px;
          top: 22px;

          transform: rotate(-12deg);
        }

        .state-closed .eyebrow {
          transform: translateY(-3px) rotate(-4deg);
        }

        .state-happy .eyebrow {
          opacity: 0.35;
        }

        /* =====================================================
           MOUTHS
        ===================================================== */

        .character-mouth {
          position: absolute;

          background: #111;

          border-radius: 10px;

          z-index: 11;

          transition: all 0.25s ease;
        }

        .orange-mouth {
          width: 14px;
          height: 3px;

          left: 58px;
          top: 46px;

          border-radius: 0 0 10px 10px;
        }

        .purple-mouth {
          width: 16px;
          height: 3px;

          left: 40px;
          top: 34px;
        }

        .black-mouth {
          width: 10px;
          height: 3px;

          left: 24px;
          top: 40px;

          opacity: 0.7;
        }

        .yellow-mouth {
          width: 25px;
          height: 3px;

          right: 12px;
          top: 68px;

          transform: rotate(3deg);
        }

        /* --- eyes-closed reaction: small pursed / worried "o" --- */

        .state-closed .orange-mouth,
        .state-closed .purple-mouth,
        .state-closed .black-mouth {
          width: 8px;
          height: 8px;

          border-radius: 50%;
        }

        .state-closed .orange-mouth {
          left: 61px;
          top: 44px;
        }

        .state-closed .purple-mouth {
          left: 43px;
          top: 31px;
        }

        .state-closed .yellow-mouth {
          transform: rotate(3deg) scaleX(0.6);
        }

        /* --- happy / peeking reaction: big grin --- */

        .state-happy .orange-mouth {
          width: 22px;
          height: 10px;

          left: 54px;
          top: 42px;

          border-radius: 0 0 14px 14px;
        }

        .state-happy .purple-mouth {
          width: 20px;
          height: 8px;

          left: 38px;
          top: 32px;

          border-radius: 0 0 12px 12px;
        }

        .state-happy .black-mouth {
          width: 16px;
          height: 6px;

          left: 21px;
          top: 39px;

          border-radius: 0 0 10px 10px;

          opacity: 1;
        }

        .state-happy .yellow-mouth {
          transform: rotate(3deg) scaleX(1.15);
        }

        /* =====================================================
           FLOATING
        ===================================================== */

        @keyframes orangeFloat {
          0%, 100% { margin-bottom: 0; }
          50% { margin-bottom: 5px; }
        }

        @keyframes purpleFloat {
          0%, 100% { margin-bottom: 0; }
          50% { margin-bottom: 8px; }
        }

        @keyframes blackFloat {
          0%, 100% { margin-bottom: 0; }
          50% { margin-bottom: 6px; }
        }

        @keyframes yellowFloat {
          0%, 100% { margin-bottom: 0; }
          50% { margin-bottom: 7px; }
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1200px) {
          .thinksync-characters {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .character {
            animation: none !important;
            transition: none !important;
          }
        }

      `}</style>
    </div>
  );
}

/* ================================================================
   EYE -- renders one of the three states: open (tracks the
   cursor), closed (flat eyelid) or happy (upward "^" squint).
================================================================ */

function Eye({
  state,
  x,
  y,
  size,
}: {
  state: EyeState;
  x: number;
  y: number;
  size: number;
}) {
  if (state === "closed") {
    return (
      <span
        className="eye eye-closed"
        style={{ width: size + 3, height: Math.max(2, size / 5) }}
      />
    );
  }

  if (state === "happy") {
    return (
      <span
        className="eye eye-happy"
        style={{ width: size + 2, height: (size + 2) / 2 }}
      />
    );
  }

  return (
    <span
      className="eye eye-open"
      style={{
        width: size,
        height: size + 4,
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <span className="pupil" />
    </span>
  );
}