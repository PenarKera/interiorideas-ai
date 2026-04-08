"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigError } from "../../lib/supabase";

export const dynamic = "force-dynamic";

const ROTATING_WORDS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Home Office",
  "Dining Room",
  "Bathroom",
];

const FEATURES = [
  {
    title: "AI room concepts",
    desc: "Generate polished interior ideas based on room type, palette, and budget.",
  },
  {
    title: "Practical furniture picks",
    desc: "Get curated product suggestions, price ranges, and styling direction fast.",
  },
  {
    title: "Class-ready reliability",
    desc: "Clear auth states, retries, and failure handling so the page stays usable.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Design Student",
    text: "The concept output felt polished enough to present without extra cleanup.",
  },
  {
    name: "James K.",
    role: "Homeowner",
    text: "I got from blank page to a full direction in a couple of minutes.",
  },
];

const SAFETY_CHECKS = [
  "Visible loading and error states",
  "Offline detection before submit",
  "Retry button for failed requests",
  "Submit locked while request is running",
];

const REQUEST_TIMEOUT_MS = 15000;

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function getResetRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}/update-password`;
}

function getFriendlyAuthError(error, action) {
  const fallback =
    action === "signup"
      ? "We could not create your account right now. Please try again."
      : action === "reset"
        ? "We could not send the password reset email right now."
        : "We could not sign you in right now. Please try again.";

  const message = error?.message?.toLowerCase?.() || "";

  if (!message) {
    return fallback;
  }

  if (message.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (message.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (message.includes("already registered") || message.includes("already been registered")) {
    return "That email is already registered. Try signing in instead.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network issue detected. Check your connection and try again.";
  }

  if (message.includes("timeout")) {
    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  return error.message || fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const formRef = useRef(null);
  const wordSwapTimeoutRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retryAction, setRetryAction] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const isBusy = loadingAction !== "";
  const authDisabled = !supabase || !isOnline;

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      wordSwapTimeoutRef.current = setTimeout(() => {
        setWordIndex((index) => (index + 1) % ROTATING_WORDS.length);
        setWordVisible(true);
      }, 320);
    }, 2400);

    return () => {
      clearInterval(interval);
      if (wordSwapTimeoutRef.current) {
        clearTimeout(wordSwapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncOnlineState = () => setIsOnline(window.navigator.onLine);
    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const validateForAuth = () => {
    if (!supabase) {
      setError(supabaseConfigError || "Supabase is not configured for this project.");
      return false;
    }

    if (!isOnline) {
      setError("You are offline. Reconnect before submitting.");
      return false;
    }

    if (isSignup && name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return false;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return false;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const validateForReset = () => {
    if (!supabase) {
      setError(supabaseConfigError || "Supabase is not configured for this project.");
      return false;
    }

    if (!isOnline) {
      setError("You are offline. Reconnect before requesting a reset link.");
      return false;
    }

    if (!isValidEmail(email)) {
      setError("Enter your email first so we know where to send the reset link.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    clearFeedback();

    if (!validateForAuth()) {
      return;
    }

    const action = isSignup ? "signup" : "signin";
    setRetryAction(action);
    setLoadingAction(action);

    try {
      const authPromise = isSignup
        ? supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: name.trim() } },
          })
        : supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

      const { error: authError } = await withTimeout(
        authPromise,
        action === "signup"
          ? "Signup timed out. Please try again."
          : "Sign in timed out. Please try again."
      );

      if (authError) {
        throw authError;
      }

      if (action === "signup") {
        setSuccess("Account created. Check your email to confirm your account.");
        setPassword("");
        return;
      }

      setSuccess("Signed in successfully. Opening your studio...");
      router.push("/");
    } catch (requestError) {
      console.error("Auth request failed:", requestError);
      setError(getFriendlyAuthError(requestError, action));
    } finally {
      setLoadingAction("");
    }
  };

  const handleForgotPassword = async () => {
    clearFeedback();

    if (!validateForReset()) {
      return;
    }

    setRetryAction("reset");
    setLoadingAction("reset");

    try {
      const { error: resetError } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getResetRedirectUrl(),
        }),
        "Reset email timed out. Please try again."
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess("Reset link sent. Check your inbox and spam folder.");
    } catch (requestError) {
      console.error("Password reset failed:", requestError);
      setError(getFriendlyAuthError(requestError, "reset"));
    } finally {
      setLoadingAction("");
    }
  };

  const handleRetry = () => {
    if (retryAction === "reset") {
      handleForgotPassword();
      return;
    }

    handleSubmit();
  };

  const pendingLabel =
    loadingAction === "signup"
      ? "Creating account..."
      : loadingAction === "reset"
        ? "Sending reset email..."
        : loadingAction === "signin"
          ? "Signing you in..."
          : "";

  return (
    <div className="login-shell">
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        input::placeholder { color: #64748b; }
        button, input { font-family: inherit; }

        @keyframes floatA {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(24px, -30px, 0); }
        }

        @keyframes floatB {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-20px, 24px, 0); }
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.7); opacity: 0.6; }
        }

        .login-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 28%),
            radial-gradient(circle at bottom right, rgba(99,102,241,0.16), transparent 30%),
            #05070a;
          color: #fff;
          font-family: Inter, system-ui, sans-serif;
          overflow-x: hidden;
        }

        .login-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          background: ${scrollY > 24 ? "rgba(5,7,10,0.84)" : "transparent"};
          backdrop-filter: ${scrollY > 24 ? "blur(18px)" : "none"};
          border-bottom: ${scrollY > 24 ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent"};
          transition: all 0.25s ease;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .brand-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          box-shadow: 0 10px 30px rgba(59,130,246,0.32);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ghost-link {
          color: #94a3b8;
          font-size: 14px;
          cursor: pointer;
        }

        .ghost-link:hover {
          color: #fff;
        }

        .primary-btn, .secondary-btn, .tab-btn, .retry-btn {
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, background 0.2s ease;
        }

        .primary-btn:hover,
        .secondary-btn:hover,
        .retry-btn:hover {
          transform: translateY(-1px);
        }

        .hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(360px, 460px);
          gap: 44px;
          align-items: center;
          padding: 120px 40px 56px;
          min-height: 100vh;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(16px);
        }

        .orb-a {
          top: 110px;
          left: -80px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%);
          animation: floatA 10s ease-in-out infinite;
        }

        .orb-b {
          bottom: 40px;
          right: 20%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          animation: floatB 11s ease-in-out infinite;
        }

        .hero-copy {
          position: relative;
          z-index: 1;
          max-width: 660px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.22);
          color: #93c5fd;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-weight: 700;
          margin-bottom: 26px;
        }

        .eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #60a5fa;
          animation: pulseDot 1.8s ease-in-out infinite;
        }

        .hero-title {
          font-size: clamp(48px, 7vw, 74px);
          line-height: 0.98;
          letter-spacing: -0.06em;
          margin: 0 0 24px;
          font-weight: 800;
        }

        .word-swap {
          color: #60a5fa;
          display: inline-block;
          min-width: 12px;
          opacity: ${wordVisible ? "1" : "0"};
          transform: ${wordVisible ? "translateY(0)" : "translateY(-10px)"};
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .hero-text {
          margin: 0 0 32px;
          max-width: 560px;
          font-size: 18px;
          color: #94a3b8;
          line-height: 1.8;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .primary-btn {
          padding: 15px 24px;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          font-weight: 800;
          box-shadow: 0 12px 28px rgba(59,130,246,0.26);
        }

        .secondary-btn {
          padding: 15px 22px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e2e8f0;
          font-weight: 700;
        }

        .micro-copy {
          font-size: 13px;
          color: #64748b;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 28px;
        }

        .feature-card,
        .testimonial-card,
        .auth-card,
        .safety-card {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(8,11,20,0.84);
          backdrop-filter: blur(18px);
        }

        .feature-card {
          border-radius: 22px;
          padding: 22px;
        }

        .feature-card h3 {
          margin: 0 0 10px;
          font-size: 17px;
          letter-spacing: -0.03em;
        }

        .feature-card p,
        .testimonial-card p {
          margin: 0;
          line-height: 1.7;
          color: #94a3b8;
          font-size: 14px;
        }

        .testimonials-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }

        .testimonial-card {
          border-radius: 18px;
          padding: 18px;
        }

        .testimonial-meta {
          margin-top: 14px;
          font-size: 12px;
          color: #cbd5e1;
        }

        .auth-column {
          position: relative;
          z-index: 1;
        }

        .auth-card {
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 28px 70px rgba(0,0,0,0.38);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .status-good {
          color: #86efac;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.22);
        }

        .status-warn {
          color: #fcd34d;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.22);
        }

        .status-bad {
          color: #fca5a5;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.22);
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 6px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 24px;
        }

        .tab-btn {
          padding: 12px 14px;
          border-radius: 12px;
          background: transparent;
          color: #94a3b8;
          font-weight: 700;
        }

        .tab-btn.is-active {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          box-shadow: 0 10px 24px rgba(59,130,246,0.24);
        }

        .auth-title {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .auth-subtitle {
          margin: 0 0 22px;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.7;
        }

        .feedback-box {
          border-radius: 14px;
          padding: 13px 14px;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 14px;
        }

        .feedback-error {
          color: #fecaca;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.22);
        }

        .feedback-success {
          color: #bbf7d0;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.22);
        }

        .feedback-loading {
          color: #bfdbfe;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.22);
        }

        .feedback-actions {
          margin-top: 10px;
          display: flex;
          justify-content: flex-start;
        }

        .retry-btn {
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }

        .field-group {
          margin-bottom: 14px;
        }

        .field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .field-label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }

        .inline-link {
          background: transparent;
          border: none;
          color: #60a5fa;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .field-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #fff;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .field-input:focus {
          border-color: rgba(96,165,250,0.8);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.16);
        }

        .submit-btn {
          width: 100%;
          margin-top: 8px;
          padding: 15px 18px;
          border-radius: 15px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(59,130,246,0.26);
        }

        .submit-btn[disabled] {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .switch-copy {
          margin: 18px 0 0;
          color: #94a3b8;
          text-align: center;
          font-size: 14px;
        }

        .safety-card {
          margin-top: 16px;
          border-radius: 20px;
          padding: 18px 18px 16px;
        }

        .safety-title {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #cbd5e1;
          margin-bottom: 14px;
        }

        .safety-list {
          display: grid;
          gap: 10px;
        }

        .safety-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.55;
        }

        .safety-mark {
          color: #4ade80;
          font-weight: 800;
        }

        @media (max-width: 1100px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 108px;
          }

          .hero-copy {
            max-width: none;
          }

          .auth-column {
            max-width: 520px;
          }
        }

        @media (max-width: 820px) {
          .login-nav {
            padding: 0 18px;
          }

          .ghost-link {
            display: none;
          }

          .hero {
            padding: 96px 18px 36px;
            gap: 28px;
          }

          .hero-grid,
          .testimonials-row {
            grid-template-columns: 1fr;
          }

          .auth-card {
            padding: 22px;
          }
        }
      `}</style>

      <nav className="login-nav">
        <div className="brand">
          <div className="brand-badge">II</div>
          <span>
            InteriorIdeas<span style={{ color: "#60A5FA" }}>.ai</span>
          </span>
        </div>

        <div className="nav-actions">
          <span className="ghost-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
            Features
          </span>
          <span className="ghost-link" onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}>
            Reviews
          </span>
          <button className="primary-btn" onClick={scrollToForm}>
            Open Auth Panel
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="orb orb-a" />
        <div className="orb orb-b" />

        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Reliable AI design login flow
          </div>

          <h1 className="hero-title">
            Design your perfect <span className="word-swap">{ROTATING_WORDS[wordIndex]}</span> with AI.
          </h1>

          <p className="hero-text">
            Create interior concepts, explore furniture direction, and sign in through a login flow that handles
            slow requests, offline states, and retry actions gracefully.
          </p>

          <div className="hero-actions">
            <button className="primary-btn" onClick={scrollToForm}>
              Start designing
            </button>
            <button className="secondary-btn" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              See what is included
            </button>
            <span className="micro-copy">No crashy auth states. Clear feedback built in.</span>
          </div>

          <div id="features" className="hero-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>

          <div id="reviews" className="testimonials-row">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="testimonial-card">
                <p>"{testimonial.text}"</p>
                <div className="testimonial-meta">
                  {testimonial.name} | {testimonial.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={formRef} className="auth-column">
          <div className="auth-card">
            {!supabase ? (
              <div className="status-pill status-bad">Config issue detected</div>
            ) : isOnline ? (
              <div className="status-pill status-good">Connection ready</div>
            ) : (
              <div className="status-pill status-warn">Offline mode detected</div>
            )}

            <div className="tabs">
              {["Sign In", "Sign Up"].map((label) => {
                const active = (label === "Sign In" && !isSignup) || (label === "Sign Up" && isSignup);

                return (
                  <button
                    key={label}
                    className={`tab-btn${active ? " is-active" : ""}`}
                    onClick={() => {
                      setIsSignup(label === "Sign Up");
                      setRetryAction("");
                      clearFeedback();
                    }}
                    disabled={isBusy}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <h2 className="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p className="auth-subtitle">
              {isSignup
                ? "Join the InteriorIdeas studio with a signup flow that gives clear feedback."
                : "Sign in to your design workspace with graceful auth handling."}
            </p>

            {!supabase && <div className="feedback-box feedback-error">{supabaseConfigError}</div>}
            {pendingLabel && <div className="feedback-box feedback-loading">{pendingLabel}</div>}

            {error && (
              <div className="feedback-box feedback-error">
                {error}
                {!!retryAction && (
                  <div className="feedback-actions">
                    <button className="retry-btn" onClick={handleRetry} disabled={isBusy}>
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}

            {success && <div className="feedback-box feedback-success">{success}</div>}

            {isSignup && (
              <div className="field-group">
                <div className="field-row">
                  <label className="field-label">Full Name</label>
                </div>
                <input
                  className="field-input"
                  type="text"
                  value={name}
                  placeholder="Your full name"
                  onChange={(event) => {
                    setName(event.target.value);
                    clearFeedback();
                  }}
                />
              </div>
            )}

            <div className="field-group">
              <div className="field-row">
                <label className="field-label">Email Address</label>
              </div>
              <input
                className="field-input"
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFeedback();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isBusy) {
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div className="field-group">
              <div className="field-row">
                <label className="field-label">Password</label>
                {!isSignup && (
                  <button className="inline-link" onClick={handleForgotPassword} disabled={authDisabled || isBusy}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                className="field-input"
                type="password"
                value={password}
                placeholder={isSignup ? "Minimum 6 characters" : "Your password"}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFeedback();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isBusy) {
                    handleSubmit();
                  }
                }}
              />
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={authDisabled || isBusy}>
              {loadingAction === "signup"
                ? "Creating account..."
                : loadingAction === "signin"
                  ? "Signing in..."
                  : isSignup
                    ? "Create Account"
                    : "Sign In"}
            </button>

            <p className="switch-copy">
              {isSignup ? "Already have an account? " : "Need an account? "}
              <button
                className="inline-link"
                onClick={() => {
                  setIsSignup((value) => !value);
                  setRetryAction("");
                  clearFeedback();
                }}
                disabled={isBusy}
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          <div className="safety-card">
            <div className="safety-title">Handled Gracefully</div>
            <div className="safety-list">
              {SAFETY_CHECKS.map((item) => (
                <div key={item} className="safety-item">
                  <span className="safety-mark">OK</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
