"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import ThinkSyncCharacters from "@/components/ThinkSyncCharacters";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============================================================
     CHARACTER PASSWORD MODE
  ============================================================ */

  const [passwordFocused, setPasswordFocused] =
    useState(false);

  const supabase = createClient();

  /* ============================================================
     REGISTER
  ============================================================ */

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,

        options: {
          data: {
            full_name: fullName.trim(),
          },

          emailRedirectTo:
            `${window.location.origin}/login`,
        },
      });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      window.location.assign("/dashboard");
      return;
    }

    setSuccess(
      "Account created successfully. Please check your email to confirm your account."
    );
  };

  /* ============================================================
     MOUSE PARALLAX
  ============================================================ */

  const handleMouseMove = (
    e: MouseEvent<HTMLDivElement>
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const x =
      (e.clientX - rect.left) /
        rect.width -
      0.5;

    const y =
      (e.clientY - rect.top) /
        rect.height -
      0.5;

    setMouse({
      x: x * 5,
      y: y * -5,
    });
  };

  const handleMouseLeave = () => {
    setMouse({
      x: 0,
      y: 0,
    });
  };

  return (
    <main className="login-page">

      {/* ========================================================
          BACKGROUND
      ======================================================== */}

      <div className="space-background">

        <div className="nebula nebula-one" />
        <div className="nebula nebula-two" />
        <div className="nebula nebula-three" />

        <div className="stars">

          {Array.from({
            length: 65,
          }).map((_, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 61) % 100}%`,
                animationDelay:
                  `${(i % 8) * 0.5}s`,
                animationDuration:
                  `${3 + (i % 5)}s`,
              }}
            />
          ))}

        </div>

        <div className="background-grid" />

      </div>

      {/* ========================================================
          TOP LOGO
      ======================================================== */}

      <div className="top-logo slide-down delay-1">

        <div className="logo-symbol">
          <span />
        </div>

        <div>

          <h1>
            Think<span>Sync</span>
          </h1>

          <p>
            Sync everything. Achieve anything.
          </p>

        </div>

      </div>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="login-layout">

        {/* ======================================================
            LEFT CINEMATIC CORE
        ====================================================== */}

        <section className="prism-section">

          <div className="core-stage">

            {/* Atmospheric glow */}

            <div className="core-aura aura-cyan" />
            <div className="core-aura aura-violet" />
            <div className="core-aura aura-pink" />

            {/* OUTER ORBIT 1 */}

            <div className="energy-ring ring-one">

              <div className="ring-dot cyan-dot" />

            </div>

            {/* OUTER ORBIT 2 */}

            <div className="energy-ring ring-two">

              <div className="ring-dot violet-dot" />

            </div>

            {/* OUTER ORBIT 3 */}

            <div className="energy-ring ring-three">

              <div className="ring-dot pink-dot" />

            </div>

            {/* CENTRAL THINKSYNC CORE */}

            <div className="sync-core">

              <div className="core-glow" />

              <div className="core-sphere">

                <div className="sphere-grid" />

                <div className="sphere-highlight" />

                <div className="core-letter">
                  <span>T</span>
                  <span>S</span>
                </div>

              </div>

              <div className="core-orbit-small" />

              <div className="core-orbit-small second" />

            </div>

            {/* DATA PARTICLES */}

            <span className="data-particle particle-one" />
            <span className="data-particle particle-two" />
            <span className="data-particle particle-three" />
            <span className="data-particle particle-four" />
            <span className="data-particle particle-five" />
            <span className="data-particle particle-six" />

            {/* STUDY */}

            <div className="feature-label feature-study slide-left delay-5">

              <div className="feature-icon cyan-border">
                📖
              </div>

              <div>
                <strong>STUDY</strong>

                <span>
                  Smart Learning
                </span>
              </div>

            </div>

            {/* SHOP */}

            <div className="feature-label feature-shop slide-right delay-6">

              <div className="feature-icon violet-border">
                🛒
              </div>

              <div>
                <strong>AI SHOPPING</strong>

                <span>
                  Choose Better
                </span>
              </div>

            </div>

            {/* EXPENSE */}

            <div className="feature-label feature-expense slide-up delay-7">

              <div className="feature-icon pink-border">
                💳
              </div>

              <div>
                <strong>EXPENSE</strong>

                <span>
                  Stay on Budget
                </span>
              </div>

            </div>

            {/* ==================================================
                CHARACTERS
                IMPORTANT:
                Positioned AFTER CORE so they visually sit
                in the foreground.
            ================================================== */}

            <ThinkSyncCharacters
              passwordFocused={
                passwordFocused
              }
            />

            {/* CORE CAPTION */}

            <div className="core-caption">

              <span className="caption-line" />

              <p>
                ONE INTELLIGENCE · THREE DIMENSIONS
              </p>

              <span className="caption-line" />

            </div>

          </div>

          {/* SECURE BADGE */}

          <div className="secure-badge slide-up delay-8">

            <div className="secure-icon">
              🛡
            </div>

            <div>

              <strong>
                Secure. Private. Encrypted.
              </strong>

              <span>
                Your data is always protected
                with end-to-end encryption.
              </span>

            </div>

          </div>

        </section>

        {/* ======================================================
            REGISTER SECTION
        ====================================================== */}

        <section
          className="login-section"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >

          <div
            className="login-card"
            style={{
              transform: `
                perspective(1200px)
                rotateX(${mouse.y}deg)
                rotateY(${mouse.x}deg)
              `,
            }}
          >

            {/* CARD GLOW */}

            <div className="card-glow" />
            <div className="card-glow-two" />

            {/* STATUS */}

            <div className="system-status slide-right delay-2">

              <span className="status-dot" />

              <span>
                All Systems Syncing
              </span>

            </div>

            {/* HEADER */}

            <div className="login-header">

              <div className="welcome-tag">

                <span />

                THINKSYNC ACCESS

              </div>

              <h2 className="slide-right delay-3">
                Create Account
              </h2>

              <p className="slide-right delay-4">
                Start your journey across the
                ThinkSync ecosystem
              </p>

            </div>

            {/* ==================================================
                REGISTER FORM
            ================================================== */}

            <form onSubmit={handleRegister}>

              {/* FULL NAME */}

              <div className="input-group slide-right delay-5">

                <label>
                  FULL NAME
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ♙
                  </span>

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value
                      )
                    }
                    autoComplete="name"
                    required
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div className="input-group slide-right delay-6">

                <label>
                  EMAIL
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    @
                  </span>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="input-group slide-right delay-7">

                <label>
                  PASSWORD
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔒
                  </span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    onFocus={() =>
                      setPasswordFocused(
                        true
                      )
                    }
                    onBlur={() =>
                      setPasswordFocused(
                        false
                      )
                    }
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="input-group slide-right delay-8">

                <label>
                  CONFIRM PASSWORD
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔒
                  </span>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    onFocus={() =>
                      setPasswordFocused(
                        true
                      )
                    }
                    onBlur={() =>
                      setPasswordFocused(
                        false
                      )
                    }
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword
                      ? "◉"
                      : "◌"}
                  </button>

                </div>

              </div>

              {/* PASSWORD HINT */}

              <div className="password-hint">

                Use at least 8 characters
                for better security.

              </div>

              {/* ERROR */}

              {error && (
                <div
                  className="auth-message error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div
                  className="auth-message success"
                  role="status"
                >
                  {success}
                </div>
              )}

              {/* REGISTER BUTTON */}

              <button
                type="submit"
                className="login-button slide-up delay-8"
                disabled={loading}
              >

                <span>
                  {loading
                    ? "Creating Account..."
                    : "Create ThinkSync Account"}
                </span>

                <span className="arrow">
                  →
                </span>

                <div className="button-shine" />

              </button>

            </form>

            {/* ==================================================
                DIVIDER
            ================================================== */}

            <div className="divider slide-up delay-9">

              <span />

              <p>
                or continue with
              </p>

              <span />

            </div>

            {/* ==================================================
                SOCIAL
            ================================================== */}

            <div className="social-buttons">

              <button
                type="button"
                className="social-button slide-left delay-10"
              >

                <span className="google-icon">
                  G
                </span>

                Google

              </button>

              <button
                type="button"
                className="social-button slide-right delay-10"
              >

                <span className="github-icon">
                  ◉
                </span>

                GitHub

              </button>

            </div>

            {/* ==================================================
                LOGIN LINK
            ================================================== */}

            <div className="register-text slide-up delay-11">

              <span>
                Already have an account?
              </span>

              <a href="/login">
                Login to ThinkSync →
              </a>

            </div>

          </div>

        </section>

      </div>

      {/* ========================================================
          BOTTOM FEATURES
      ======================================================== */}

      <div className="bottom-features">

        <div className="bottom-feature slide-up delay-9">

          <div className="bottom-icon cyan">
            ⚡
          </div>

          <div>

            <strong>
              One Workspace
            </strong>

            <span>
              All your tools in one
              beautiful workspace.
            </span>

          </div>

        </div>

        <div className="bottom-feature slide-up delay-10">

          <div className="bottom-icon violet">
            ✦
          </div>

          <div>

            <strong>
              AI Powered
            </strong>

            <span>
              Smart suggestions and
              automation to save time.
            </span>

          </div>

        </div>

        <div className="bottom-feature slide-up delay-11">

          <div className="bottom-icon pink">
            🔐
          </div>

          <div>

            <strong>
              Privacy First
            </strong>

            <span>
              Your data is yours.
              Always will be.
            </span>

          </div>

        </div>

      </div>

      {/* ========================================================
          STYLES
      ======================================================== */}

      <style jsx>{`

        /* ========================================================
           PAGE
        ======================================================== */

        .login-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 20% 45%,
              rgba(34, 211, 238, 0.08),
              transparent 30%
            ),
            radial-gradient(
              circle at 78% 42%,
              rgba(139, 92, 246, 0.10),
              transparent 32%
            ),
            radial-gradient(
              circle at 50% 100%,
              rgba(236, 72, 153, 0.045),
              transparent 35%
            ),
            #010106;

          color: white;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* ========================================================
           BACKGROUND
        ======================================================== */

        .space-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .nebula {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }

        .nebula-one {
          width: 550px;
          height: 550px;

          left: -180px;
          top: 12%;

          background:
            rgba(
              34,
              211,
              238,
              0.09
            );
        }

        .nebula-two {
          width: 550px;
          height: 550px;

          right: -180px;
          top: 8%;

          background:
            rgba(
              139,
              92,
              246,
              0.11
            );
        }

        .nebula-three {
          width: 450px;
          height: 450px;

          left: 40%;
          bottom: -250px;

          background:
            rgba(
              236,
              72,
              153,
              0.045
            );
        }

        .background-grid {
          position: absolute;
          inset: 0;

          opacity: 0.13;

          background-image:
            linear-gradient(
              rgba(34, 211, 238, 0.07)
              1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(139, 92, 246, 0.07)
              1px,
              transparent 1px
            );

          background-size:
            90px 90px;

          mask-image:
            radial-gradient(
              ellipse at center,
              black 0%,
              transparent 75%
            );
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

          opacity: 0.35;

          animation:
            twinkle
            4s
            ease-in-out
            infinite;
        }

        @keyframes twinkle {

          0%,
          100% {
            opacity: 0.12;
            transform: scale(1);
          }

          50% {
            opacity: 0.9;
            transform: scale(2);
          }

        }

        /* ========================================================
           TOP LOGO
        ======================================================== */

        .top-logo {
          position: absolute;

          top: 28px;
          left: 55px;

          z-index: 20;

          display: flex;
          align-items: center;

          gap: 13px;
        }

        .logo-symbol {
          position: relative;

          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(
              34,
              211,
              238,
              0.65
            );

          border-radius: 11px;

          box-shadow:
            0 0 25px
              rgba(
                34,
                211,
                238,
                0.18
              ),
            inset 0 0 18px
              rgba(
                34,
                211,
                238,
                0.08
              );

          transform: rotate(45deg);
        }

        .logo-symbol span {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #22d3ee;

          box-shadow:
            0 0 12px #22d3ee,
            0 0 25px #22d3ee;

          transform: rotate(-45deg);
        }

        .top-logo h1 {
          margin: 0;

          color: white;

          font-size: 25px;

          letter-spacing: -1px;

          text-shadow:
            0 1px 12px
            rgba(0, 0, 0, 0.45);
        }

        .top-logo h1 span {
          color: #22d3ee;
        }

        .top-logo p {
          margin: 4px 0 0;

          color: #aebbd0;

          font-size: 10px;

          letter-spacing: 0.08em;
        }

        /* ========================================================
           LAYOUT
        ======================================================== */

        .login-layout {
          position: relative;

          z-index: 5;

          min-height: 100vh;

          display: grid;

          grid-template-columns:
            1fr
            0.85fr;

          align-items: center;

          gap: 30px;

          max-width: 1450px;

          margin: auto;

          padding:
            100px
            70px
            160px;
        }

        /* ========================================================
           CORE SECTION
        ======================================================== */

        .prism-section {
          min-height: 650px;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          gap: 26px;
        }

        .core-stage {
          position: relative;

          width: 620px;
          height: 560px;

          display: flex;

          align-items: flex-start;
          justify-content: center;

          padding-top: 40px;

          perspective: 1200px;

          isolation: isolate;
        }

        /* ========================================================
           CORE ATMOSPHERE
        ======================================================== */

        .core-aura {
          position: absolute;

          width: 300px;
          height: 300px;

          border-radius: 50%;

          filter: blur(70px);

          pointer-events: none;
        }

        .aura-cyan {
          background:
            rgba(
              34,
              211,
              238,
              0.18
            );

          transform:
            translate(-70px, 10px);
        }

        .aura-violet {
          background:
            rgba(
              139,
              92,
              246,
              0.18
            );

          transform:
            translate(70px, -20px);
        }

        .aura-pink {
          background:
            rgba(
              236,
              72,
              153,
              0.08
            );

          transform:
            translate(0, 70px);
        }

        /* ========================================================
           CENTRAL CORE
        ======================================================== */

        .sync-core {
          position: relative;

          width: 230px;
          height: 230px;

          display: flex;

          align-items: center;
          justify-content: center;

          z-index: 6;

          animation:
            coreFloat
            5s
            ease-in-out
            infinite;
        }

        .core-glow {
          position: absolute;

          width: 260px;
          height: 260px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(34, 211, 238, 0.30),
              rgba(139, 92, 246, 0.18),
              transparent 70%
            );

          filter: blur(30px);

          animation:
            glowPulse
            3s
            ease-in-out
            infinite;
        }

        /* ========================================================
           CORE SPHERE
        ======================================================== */

        .core-sphere {
          position: relative;

          width: 155px;
          height: 155px;

          border-radius: 50%;

          overflow: hidden;

          background:
            radial-gradient(
              circle at 32% 25%,
              rgba(86, 232, 255, 0.28),
              transparent 30%
            ),
            radial-gradient(
              circle at 72% 70%,
              rgba(139, 92, 246, 0.35),
              transparent 48%
            ),
            #030814;

          border:
            1px solid
            rgba(
              91,
              233,
              255,
              0.8
            );

          box-shadow:
            0 0 25px
              rgba(
                34,
                211,
                238,
                0.45
              ),
            0 0 70px
              rgba(
                139,
                92,
                246,
                0.25
              ),
            inset 0 0 30px
              rgba(
                34,
                211,
                238,
                0.18
              );

          transform-style: preserve-3d;

          animation:
            sphereRotate
            14s
            linear
            infinite;
        }

        .sphere-highlight {
          position: absolute;

          width: 65px;
          height: 65px;

          left: 22px;
          top: 16px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(
                255,
                255,
                255,
                0.22
              ),
              transparent 70%
            );

          filter: blur(4px);
        }

        /* ========================================================
           SPHERE GRID
        ======================================================== */

        .sphere-grid {
          position: absolute;

          inset: -10%;

          border-radius: 50%;

          background:
            repeating-radial-gradient(
              circle at center,
              transparent 0px,
              transparent 17px,
              rgba(
                34,
                211,
                238,
                0.13
              ) 18px,
              transparent 19px
            );

          opacity: 0.7;

          animation:
            gridMove
            7s
            linear
            infinite;
        }

        .sphere-grid::before,
        .sphere-grid::after {
          content: "";

          position: absolute;

          inset: 0;

          border-radius: 50%;
        }

        .sphere-grid::before {
          background:
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 17px,
              rgba(
                139,
                92,
                246,
                0.14
              ) 18px,
              transparent 19px
            );

          transform:
            rotate(25deg)
            scale(1.3);
        }

        .sphere-grid::after {
          background:
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 17px,
              rgba(
                34,
                211,
                238,
                0.11
              ) 18px,
              transparent 19px
            );

          transform:
            rotate(-20deg)
            scale(1.3);
        }

        /* ========================================================
           CORE LETTER
        ======================================================== */

        .core-letter {
          position: absolute;

          inset: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          color: white;

          font-size: 42px;

          font-weight: 800;

          letter-spacing: -4px;

          text-shadow:
            0 0 10px #22d3ee,
            0 0 25px #8b5cf6,
            0 0 50px
              rgba(
                34,
                211,
                238,
                0.5
              );
        }

        /* ========================================================
           SMALL ORBITS
        ======================================================== */

        .core-orbit-small {
          position: absolute;

          width: 210px;
          height: 75px;

          border:
            1px solid
            rgba(
              34,
              211,
              238,
              0.65
            );

          border-radius: 50%;

          transform:
            rotateX(65deg)
            rotateZ(-20deg);

          box-shadow:
            0 0 15px
              rgba(
                34,
                211,
                238,
                0.25
              );

          animation:
            smallOrbit
            6s
            linear
            infinite;
        }

        .core-orbit-small.second {
          width: 185px;
          height: 65px;

          border-color:
            rgba(
              139,
              92,
              246,
              0.55
            );

          transform:
            rotateX(65deg)
            rotateZ(65deg);

          animation:
            smallOrbitTwo
            8s
            linear
            infinite;
        }

        /* ========================================================
           LARGE ENERGY RINGS
        ======================================================== */

        .energy-ring {
          position: absolute;

          left: 50%;
          top: 155px;

          border-radius: 50%;

          pointer-events: none;
        }

        .ring-one {
          width: 390px;
          height: 175px;

          border:
            2px solid
            rgba(
              34,
              211,
              238,
              0.45
            );

          transform:
            translate(-50%, -50%)
            rotateX(68deg)
            rotateZ(-18deg);

          animation:
            ringOne
            9s
            linear
            infinite;
        }

        .ring-two {
          width: 450px;
          height: 205px;

          border:
            1px solid
            rgba(
              139,
              92,
              246,
              0.4
            );

          transform:
            translate(-50%, -50%)
            rotateX(67deg)
            rotateZ(28deg);

          animation:
            ringTwo
            12s
            linear
            infinite;
        }

        .ring-three {
          width: 520px;
          height: 235px;

          border:
            1px solid
            rgba(
              236,
              72,
              153,
              0.25
            );

          transform:
            translate(-50%, -50%)
            rotateX(70deg)
            rotateZ(-8deg);

          animation:
            ringThree
            16s
            linear
            infinite;
        }

        /* ========================================================
           RING DOTS
        ======================================================== */

        .ring-dot {
          position: absolute;

          width: 9px;
          height: 9px;

          border-radius: 50%;

          top: -4px;
          left: 50%;

          transform:
            translateX(-50%);
        }

        .cyan-dot {
          background: #22d3ee;

          box-shadow:
            0 0 10px #22d3ee,
            0 0 25px #22d3ee;
        }

        .violet-dot {
          background: #8b5cf6;

          box-shadow:
            0 0 10px #8b5cf6,
            0 0 25px #8b5cf6;
        }

        .pink-dot {
          background: #ec4899;

          box-shadow:
            0 0 10px #ec4899,
            0 0 25px #ec4899;
        }

        /* ========================================================
           PARTICLES
        ======================================================== */

        .data-particle {
          position: absolute;

          width: 4px;
          height: 4px;

          border-radius: 50%;

          animation:
            particleFloat
            4s
            ease-in-out
            infinite;
        }

        .particle-one {
          left: 15%;
          top: 15%;

          background: #22d3ee;

          box-shadow:
            0 0 14px #22d3ee;
        }

        .particle-two {
          right: 15%;
          top: 10%;

          background: #8b5cf6;

          box-shadow:
            0 0 14px #8b5cf6;

          animation-delay: -1s;
        }

        .particle-three {
          left: 20%;
          top: 42%;

          background: #ec4899;

          box-shadow:
            0 0 14px #ec4899;

          animation-delay: -2s;
        }

        .particle-four {
          right: 21%;
          top: 38%;

          background: #22d3ee;

          box-shadow:
            0 0 14px #22d3ee;

          animation-delay: -3s;
        }

        .particle-five {
          left: 50%;
          top: 2%;

          background: white;

          box-shadow:
            0 0 12px white;

          animation-delay: -1.5s;
        }

        .particle-six {
          right: 31%;
          top: 30%;

          background: #8b5cf6;

          box-shadow:
            0 0 14px #8b5cf6;

          animation-delay: -2.5s;
        }

        /* ========================================================
           FEATURE LABELS
        ======================================================== */

        .feature-label {
          position: absolute;

          display: flex;

          align-items: center;

          gap: 12px;

          min-width: 175px;

          padding:
            10px
            15px;

          border:
            1px solid
            rgba(
              170,
              190,
              220,
              0.2
            );

          border-radius: 12px;

          background:
            rgba(
              3,
              8,
              18,
              0.88
            );

          backdrop-filter:
            blur(15px);

          box-shadow:
            0 10px 30px
              rgba(
                0,
                0,
                0,
                0.32
              ),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.06
              );

          z-index: 40;
        }

        .feature-label strong {
          display: block;

          color: white;

          font-size: 12px;

          font-weight: 800;

          letter-spacing: 1px;
        }

        .feature-label span {
          display: block;

          margin-top: 4px;

          color: #c0cad8;

          font-size: 11px;

          font-weight: 500;
        }

        .feature-study {
          left: 20px;
          top: 90px;
        }

        .feature-shop {
          right: 10px;
          top: 130px;
        }

        .feature-expense {
          top: 300px;

          left: 50%;

          transform:
            translateX(-50%);
        }

        .feature-icon {
          width: 42px;
          height: 42px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            rgba(
              0,
              0,
              0,
              0.3
            );

          font-size: 18px;
        }

        .cyan-border {
          border:
            1px solid #22d3ee;

          box-shadow:
            0 0 18px
              rgba(
                34,
                211,
                238,
                0.22
              );
        }

        .violet-border {
          border:
            1px solid #8b5cf6;

          box-shadow:
            0 0 18px
              rgba(
                139,
                92,
                246,
                0.22
              );
        }

        .pink-border {
          border:
            1px solid #ec4899;

          box-shadow:
            0 0 18px
              rgba(
                236,
                72,
                153,
                0.22
              );
        }

        /* ========================================================
           CORE CAPTION
        ======================================================== */

        .core-caption {
          position: absolute;

          top: 360px;
          left: 50%;

          transform:
            translateX(-50%);

          display: flex;

          align-items: center;

          gap: 10px;

          white-space: nowrap;

          opacity: 0.7;

          z-index: 40;
        }

        .core-caption p {
          margin: 0;

          color:
            rgba(
              148,
              163,
              184,
              0.8
            );

          font-size: 8px;

          letter-spacing:
            0.38em;
        }

        .caption-line {
          width: 22px;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(
                34,
                211,
                238,
                0.7
              )
            );
        }

        .caption-line:last-child {
          background:
            linear-gradient(
              90deg,
              rgba(
                139,
                92,
                246,
                0.7
              ),
              transparent
            );
        }

        /* ========================================================
           SECURE BADGE
        ======================================================== */

        .secure-badge {
          display: flex;

          align-items: center;

          gap: 12px;

          max-width: 330px;

          padding:
            12px
            18px;

          border:
            1px solid
            rgba(
              170,
              190,
              220,
              0.18
            );

          border-radius: 30px;

          background:
            rgba(
              3,
              8,
              18,
              0.9
            );

          backdrop-filter:
            blur(20px);

          box-shadow:
            0 10px 35px
              rgba(
                0,
                0,
                0,
                0.3
              ),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.05
              );
        }

        .secure-icon {
          color: #8b5cf6;

          font-size: 24px;

          filter:
            drop-shadow(
              0 0 10px
              rgba(
                139,
                92,
                246,
                0.5
              )
            );
        }

        .secure-badge strong {
          display: block;

          color: white;

          font-size: 12px;

          font-weight: 800;
        }

        .secure-badge span {
          display: block;

          margin-top: 3px;

          color: #b7c2d2;

          font-size: 10px;
        }

        /* ========================================================
           LOGIN / REGISTER SECTION
        ======================================================== */

        .login-section {
          display: flex;

          justify-content: center;

          align-items: center;
        }

        /* ========================================================
           CARD
        ======================================================== */

        .login-card {
          position: relative;

          width: 100%;

          max-width: 520px;

          padding: 45px;

          border-radius: 28px;

          border:
            1px solid
            rgba(
              139,
              92,
              246,
              0.35
            );

          background:
            linear-gradient(
              145deg,
              rgba(
                18,
                25,
                48,
                0.96
              ),
              rgba(
                5,
                9,
                20,
                0.95
              )
            );

          backdrop-filter:
            blur(25px);

          box-shadow:
            0 30px 100px
              rgba(
                0,
                0,
                0,
                0.62
              ),
            0 0 60px
              rgba(
                139,
                92,
                246,
                0.10
              ),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.06
              );

          transition:
            transform
            0.15s
            ease-out;
        }

        .login-card::before {
          content: "";

          position: absolute;

          inset: 0;

          border-radius: inherit;

          padding: 1px;

          background:
            linear-gradient(
              120deg,
              transparent 20%,
              rgba(
                34,
                211,
                238,
                0.7
              ),
              rgba(
                139,
                92,
                246,
                0.7
              ),
              rgba(
                236,
                72,
                153,
                0.4
              ),
              transparent 80%
            );

          mask:
            linear-gradient(#fff 0 0)
              content-box,
            linear-gradient(#fff 0 0);

          mask-composite:
            exclude;

          pointer-events: none;

          opacity: 0.55;
        }

        .card-glow {
          position: absolute;

          width: 220px;
          height: 220px;

          top: -120px;
          right: -80px;

          border-radius: 50%;

          background:
            rgba(
              139,
              92,
              246,
              0.13
            );

          filter: blur(60px);

          pointer-events: none;
        }

        .card-glow-two {
          position: absolute;

          width: 170px;
          height: 170px;

          left: -90px;
          bottom: -100px;

          border-radius: 50%;

          background:
            rgba(
              34,
              211,
              238,
              0.08
            );

          filter: blur(55px);

          pointer-events: none;
        }

        /* ========================================================
           STATUS
        ======================================================== */

        .system-status {
          position: absolute;

          right: 30px;
          top: 25px;

          display: flex;

          align-items: center;

          gap: 8px;

          padding:
            8px
            13px;

          border:
            1px solid
            rgba(
              160,
              180,
              210,
              0.18
            );

          border-radius: 20px;

          background:
            rgba(
              20,
              28,
              48,
              0.85
            );

          color: #d2d9e5;

          font-size: 10px;

          font-weight: 600;
        }

        .status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #32e6a5;

          box-shadow:
            0 0 12px #32e6a5;

          animation:
            statusPulse
            2s
            infinite;
        }

        @keyframes statusPulse {

          0%,
          100% {
            opacity: 0.5;
          }

          50% {
            opacity: 1;
          }

        }

        /* ========================================================
           HEADER
        ======================================================== */

        .login-header {
          margin-top: 35px;

          margin-bottom: 30px;
        }

        .welcome-tag {
          display: flex;

          align-items: center;

          gap: 7px;

          margin-bottom: 15px;

          color:
            rgba(
              34,
              211,
              238,
              0.8
            );

          font-size: 8px;

          font-weight: 700;

          letter-spacing:
            0.28em;
        }

        .welcome-tag span {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: #22d3ee;

          box-shadow:
            0 0 10px #22d3ee;
        }

        .login-header h2 {
          margin: 0;

          color: white;

          font-size: 38px;

          letter-spacing: -1.5px;

          text-shadow:
            0 2px 18px
            rgba(
              0,
              0,
              0,
              0.35
            );
        }

        .login-header p {
          margin: 10px 0 0;

          color: #b9c4d4;

          font-size: 14px;

          font-weight: 500;
        }

        /* ========================================================
           INPUTS
        ======================================================== */

        .input-group {
          margin-bottom: 18px;
        }

        .input-group label {
          display: block;

          margin-bottom: 9px;

          color: #d0d8e5;

          font-size: 10px;

          letter-spacing: 1.5px;

          font-weight: 800;
        }

        .input-wrapper {
          position: relative;

          display: flex;

          align-items: center;
        }

        .input-wrapper input {
          width: 100%;

          height: 55px;

          padding:
            0
            48px;

          border:
            1px solid
            rgba(
              180,
              195,
              220,
              0.18
            );

          border-radius: 12px;

          outline: none;

          background:
            rgba(
              1,
              5,
              14,
              0.72
            );

          color: white;

          font-size: 14px;

          transition:
            all
            0.3s
            ease;
        }

        .input-wrapper input::placeholder {
          color: #9ba7b9;

          opacity: 1;
        }

        .input-wrapper input:focus {
          border-color:
            rgba(
              34,
              211,
              238,
              0.65
            );

          background:
            rgba(
              0,
              210,
              255,
              0.025
            );

          box-shadow:
            0 0 25px
              rgba(
                0,
                220,
                255,
                0.08
              ),
            inset 0 0 20px
              rgba(
                0,
                220,
                255,
                0.025
              );
        }

        .input-icon {
          position: absolute;

          left: 17px;

          z-index: 2;

          color: #b5c0d1;

          font-size: 17px;
        }

        .eye-button {
          position: absolute;

          right: 14px;

          border: 0;

          background: transparent;

          color: #c2ccda;

          cursor: pointer;

          font-weight: 600;
        }

        .eye-button:hover {
          color: white;
        }

        /* ========================================================
           PASSWORD HINT
        ======================================================== */

        .password-hint {
          margin:
            -5px
            0
            18px;

          color: #8997aa;

          font-size: 10px;

          line-height: 1.5;

          font-weight: 500;
        }

        /* ========================================================
           ERROR / SUCCESS
        ======================================================== */

        .auth-message {
          margin:
            -3px
            0
            16px;

          padding:
            11px
            13px;

          border-radius: 9px;

          font-size: 11px;

          line-height: 1.45;

          font-weight: 600;
        }

        .auth-message.error {
          color: #ffb7c2;

          border:
            1px solid
            rgba(
              255,
              75,
              105,
              0.35
            );

          background:
            rgba(
              120,
              20,
              45,
              0.22
            );
        }

        .auth-message.success {
          color: #9fffd5;

          border:
            1px solid
            rgba(
              55,
              240,
              175,
              0.3
            );

          background:
            rgba(
              15,
              110,
              75,
              0.2
            );
        }

        /* ========================================================
           REGISTER BUTTON
        ======================================================== */

        .login-button {
          position: relative;

          overflow: hidden;

          width: 100%;

          height: 58px;

          border: 0;

          border-radius: 12px;

          background:
            linear-gradient(
              100deg,
              #22d3ee,
              #3b9dff,
              #8b5cf6,
              #ec4899
            );

          background-size:
            250% 100%;

          color: white;

          font-size: 15px;

          font-weight: 600;

          cursor: pointer;

          box-shadow:
            0 10px 35px
              rgba(
                83,
                90,
                255,
                0.22
              );

          transition:
            all
            0.3s
            ease;

          animation:
            buttonGradient
            7s
            ease
            infinite;
        }

        .login-button:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 15px 45px
              rgba(
                83,
                90,
                255,
                0.35
              );
        }

        .login-button:disabled {
          cursor: not-allowed;

          opacity: 0.65;
        }

        .login-button .arrow {
          position: absolute;

          right: 20px;

          font-size: 21px;
        }

        .button-shine {
          position: absolute;

          width: 100px;

          height: 100%;

          top: 0;

          left: -150px;

          transform:
            skewX(-25deg);

          background:
            rgba(
              255,
              255,
              255,
              0.25
            );

          animation:
            buttonShine
            4s
            infinite;
        }

        @keyframes buttonGradient {

          0% {
            background-position:
              0% 50%;
          }

          50% {
            background-position:
              100% 50%;
          }

          100% {
            background-position:
              0% 50%;
          }

        }

        @keyframes buttonShine {

          0% {
            left: -150px;
          }

          40%,
          100% {
            left: 120%;
          }

        }

        /* ========================================================
           DIVIDER
        ======================================================== */

        .divider {
          display: flex;

          align-items: center;

          gap: 15px;

          margin: 24px 0;
        }

        .divider span {
          height: 1px;

          flex: 1;

          background:
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .divider p {
          margin: 0;

          color: #aeb9ca;

          font-size: 10px;

          font-weight: 500;
        }

        /* ========================================================
           SOCIAL
        ======================================================== */

        .social-buttons {
          display: grid;

          grid-template-columns:
            1fr
            1fr;

          gap: 12px;
        }

        .social-button {
          height: 50px;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 10px;

          border:
            1px solid
            rgba(
              180,
              195,
              220,
              0.17
            );

          border-radius: 11px;

          background:
            rgba(
              8,
              13,
              25,
              0.72
            );

          color: #f0f3f8;

          cursor: pointer;

          transition:
            all
            0.3s
            ease;

          font-weight: 600;
        }

        .social-button:hover {
          border-color:
            rgba(
              255,
              255,
              255,
              0.2
            );

          background:
            rgba(
              255,
              255,
              255,
              0.05
            );

          transform:
            translateY(-2px);
        }

        .google-icon {
          color: #4285f4;

          font-weight: bold;

          font-size: 18px;
        }

        .github-icon {
          color: white;
        }

        /* ========================================================
           LOGIN LINK
        ======================================================== */

        .register-text {
          display: flex;

          justify-content: center;

          gap: 7px;

          margin-top: 25px;

          color: #b6c0cf;

          font-size: 12px;

          font-weight: 500;
        }

        .register-text a {
          color: #5fe7ff;

          text-decoration: none;

          font-weight: 800;

          transition: color 0.2s ease;
        }

        .register-text a:hover {
          color: white;
        }

        /* ========================================================
           BOTTOM FEATURES
        ======================================================== */

        .bottom-features {
          position: absolute;

          z-index: 20;

          bottom: 20px;

          left: 50%;

          transform:
            translateX(-50%);

          width:
            calc(100% - 100px);

          max-width: 1350px;

          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          padding:
            18px
            35px;

          border:
            1px solid
            rgba(
              170,
              190,
              220,
              0.15
            );

          border-radius: 20px;

          background:
            rgba(
              3,
              8,
              18,
              0.9
            );

          backdrop-filter:
            blur(25px);

          box-shadow:
            0 15px 45px
              rgba(
                0,
                0,
                0,
                0.35
              ),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.05
              );
        }

        .bottom-feature {
          display: flex;

          align-items: center;

          justify-content: center;

          gap: 15px;
        }

        .bottom-feature
          + .bottom-feature {
          border-left:
            1px solid
            rgba(
              180,
              195,
              220,
              0.14
            );
        }

        .bottom-icon {
          width: 42px;
          height: 42px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          font-size: 18px;
        }

        .bottom-icon.cyan {
          border:
            1px solid #22d3ee;

          color: #22d3ee;

          box-shadow:
            0 0 18px
              rgba(
                34,
                211,
                238,
                0.18
              );
        }

        .bottom-icon.violet {
          border:
            1px solid #8b5cf6;

          color: #8b5cf6;

          box-shadow:
            0 0 18px
              rgba(
                139,
                92,
                246,
                0.18
              );
        }

        .bottom-icon.pink {
          border:
            1px solid #ec4899;

          color: #ec4899;

          box-shadow:
            0 0 18px
              rgba(
                236,
                72,
                153,
                0.18
              );
        }

        .bottom-feature strong {
          display: block;

          color: white;

          font-size: 13px;

          font-weight: 800;
        }

        .bottom-feature span {
          display: block;

          max-width: 220px;

          margin-top: 4px;

          color: #aeb9c9;

          font-size: 10px;

          line-height: 1.5;

          font-weight: 500;
        }

        /* ========================================================
           ANIMATIONS
        ======================================================== */

        .slide-right {
          opacity: 0;

          animation:
            slideRight
            0.8s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            forwards;
        }

        .slide-left {
          opacity: 0;

          animation:
            slideLeft
            0.8s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            forwards;
        }

        .slide-up {
          opacity: 0;

          animation:
            slideUp
            0.8s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            forwards;
        }

        .slide-down {
          opacity: 0;

          animation:
            slideDown
            0.8s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            forwards;
        }

        @keyframes slideRight {

          from {
            opacity: 0;

            transform:
              translateX(60px);
          }

          to {
            opacity: 1;

            transform:
              translateX(0);
          }

        }

        @keyframes slideLeft {

          from {
            opacity: 0;

            transform:
              translateX(-60px);
          }

          to {
            opacity: 1;

            transform:
              translateX(0);
          }

        }

        @keyframes slideUp {

          from {
            opacity: 0;

            transform:
              translateY(50px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }

        }

        @keyframes slideDown {

          from {
            opacity: 0;

            transform:
              translateY(-40px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }

        }

        /* ========================================================
           DELAYS
        ======================================================== */

        .delay-1 {
          animation-delay: 0.1s;
        }

        .delay-2 {
          animation-delay: 0.25s;
        }

        .delay-3 {
          animation-delay: 0.4s;
        }

        .delay-4 {
          animation-delay: 0.5s;
        }

        .delay-5 {
          animation-delay: 0.65s;
        }

        .delay-6 {
          animation-delay: 0.8s;
        }

        .delay-7 {
          animation-delay: 0.95s;
        }

        .delay-8 {
          animation-delay: 1.1s;
        }

        .delay-9 {
          animation-delay: 1.25s;
        }

        .delay-10 {
          animation-delay: 1.4s;
        }

        .delay-11 {
          animation-delay: 1.55s;
        }

        /* ========================================================
           CORE ANIMATIONS
        ======================================================== */

        @keyframes coreFloat {

          0%,
          100% {
            transform:
              translateY(0);
          }

          50% {
            transform:
              translateY(-15px);
          }

        }

        @keyframes glowPulse {

          0%,
          100% {
            opacity: 0.65;

            transform:
              scale(0.95);
          }

          50% {
            opacity: 1;

            transform:
              scale(1.08);
          }

        }

        @keyframes sphereRotate {

          from {
            transform:
              rotateY(0deg)
              rotateX(4deg);
          }

          to {
            transform:
              rotateY(360deg)
              rotateX(4deg);
          }

        }

        @keyframes gridMove {

          from {
            transform:
              rotate(0deg)
              scale(1.1);
          }

          to {
            transform:
              rotate(360deg)
              scale(1.1);
          }

        }

        @keyframes smallOrbit {

          from {
            transform:
              rotateX(65deg)
              rotateZ(-20deg)
              rotate(0deg);
          }

          to {
            transform:
              rotateX(65deg)
              rotateZ(-20deg)
              rotate(360deg);
          }

        }

        @keyframes smallOrbitTwo {

          from {
            transform:
              rotateX(65deg)
              rotateZ(65deg)
              rotate(0deg);
          }

          to {
            transform:
              rotateX(65deg)
              rotateZ(65deg)
              rotate(-360deg);
          }

        }

        @keyframes ringOne {

          from {
            transform:
              translate(-50%, -50%)
              rotateX(68deg)
              rotateZ(-18deg)
              rotate(0deg);
          }

          to {
            transform:
              translate(-50%, -50%)
              rotateX(68deg)
              rotateZ(-18deg)
              rotate(360deg);
          }

        }

        @keyframes ringTwo {

          from {
            transform:
              translate(-50%, -50%)
              rotateX(67deg)
              rotateZ(28deg)
              rotate(0deg);
          }

          to {
            transform:
              translate(-50%, -50%)
              rotateX(67deg)
              rotateZ(28deg)
              rotate(-360deg);
          }

        }

        @keyframes ringThree {

          from {
            transform:
              translate(-50%, -50%)
              rotateX(70deg)
              rotateZ(-8deg)
              rotate(0deg);
          }

          to {
            transform:
              translate(-50%, -50%)
              rotateX(70deg)
              rotateZ(-8deg)
              rotate(360deg);
          }

        }

        @keyframes particleFloat {

          0%,
          100% {
            transform:
              translate3d(0, 0, 0)
              scale(1);

            opacity: 0.35;
          }

          50% {
            transform:
              translate3d(0, -20px, 0)
              scale(1.8);

            opacity: 1;
          }

        }

        /* ========================================================
           RESPONSIVE
        ======================================================== */

        @media (max-width: 1200px) {

          .login-layout {
            grid-template-columns: 1fr;

            padding:
              100px
              50px
              80px;
          }

          .prism-section {
            display: none;
          }

          .login-section {
            min-height:
              calc(
                100vh - 100px
              );
          }

          .login-card {
            max-width: 560px;
          }

        }

        @media (max-width: 700px) {

          .top-logo {
            left: 25px;
            top: 20px;
          }

          .top-logo h1 {
            font-size: 20px;
          }

          .top-logo p {
            font-size: 9px;
          }

          .login-layout {
            padding:
              90px
              20px
              40px;
          }

          .login-card {
            padding:
              30px
              22px;

            border-radius: 22px;
          }

          .login-header h2 {
            font-size: 30px;
          }

          .login-header p {
            font-size: 13px;
          }

          .system-status {
            display: none;
          }

          .bottom-features {
            display: none;
          }

          .social-buttons {
            grid-template-columns:
              1fr;
          }

        }

        @media (max-width: 430px) {

          .login-layout {
            padding:
              85px
              14px
              25px;
          }

          .login-card {
            padding:
              27px
              18px;
          }

          .login-header h2 {
            font-size: 28px;
          }

          .register-text {
            flex-direction: column;

            align-items: center;

            gap: 5px;
          }

        }

        /* ========================================================
           REDUCED MOTION
        ======================================================== */

        @media (prefers-reduced-motion: reduce) {

          *,
          *::before,
          *::after {
            animation-duration:
              0.01ms !important;

            animation-iteration-count:
              1 !important;

            transition-duration:
              0.01ms !important;
          }

        }

      `}</style>

    </main>
  );
}
