"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const ROTATING_WORDS = ["Living Room", "Bedroom", "Kitchen", "Home Office", "Dining Room", "Bathroom"];

const FEATURES = [
  { icon: "🛋️", title: "Smart Room Layouts", desc: "AI analyzes your space and generates optimized furniture arrangements for maximum comfort and flow." },
  { icon: "🎨", title: "Color Psychology", desc: "Get scientifically-backed color palettes tailored to your room type, lighting, and personal style." },
  { icon: "🪑", title: "Furniture Curation", desc: "Receive curated furniture recommendations with exact prices matched to your budget range." },
  { icon: "💡", title: "Expert Pro Tips", desc: "Each design comes with professional interior designer insights to elevate your space." },
  { icon: "📊", title: "Design Analytics", desc: "Track your design history, favorite styles, and most-designed rooms in your personal dashboard." },
  { icon: "🖨️", title: "PDF Export", desc: "Export any design concept as a PDF to share with contractors, family, or save for later." },
];

const TESTIMONIALS = [
  { name: "Sarah M.", role: "Interior Design Student", text: "InteriorIdeas.ai transformed my living room concept in minutes. The AI suggestions were incredibly professional.", avatar: "S" },
  { name: "James K.", role: "Homeowner", text: "I was renovating my entire apartment and this tool saved me weeks of planning. The furniture recommendations were spot on.", avatar: "J" },
  { name: "Alina R.", role: "Real Estate Agent", text: "I use this for every property I stage. Clients love seeing AI-generated concepts before committing to renovations.", avatar: "A" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const formRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length);
        setWordVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const validate = () => {
    if (isSignup && name.trim().length < 2) { setError("Name must be at least 2 characters."); return false; }
    if (!email.includes("@") || !email.includes(".")) { setError("Please enter a valid email."); return false; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        alert("✅ Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!email) { setError("Please enter your email address first."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: "http://localhost:3000/update-password" });
    if (error) setError(error.message);
    else alert("✅ Reset link sent! Check your email inbox.");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05070A", fontFamily: "system-ui, -apple-system, sans-serif", color: "#fff", overflowX: "hidden" }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        input::placeholder { color: #334155; }
        @keyframes floatOrb1 { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-40px) translateX(25px)} 66%{transform:translateY(20px) translateX(-20px)} }
        @keyframes floatOrb2 { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-50px) translateX(35px)} }
        @keyframes floatOrb3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(30px)} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px #3B82F6} 50%{opacity:0.5;box-shadow:0 0 20px #3B82F6} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .card-hover { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
        .card-hover:hover { transform: translateY(-6px); border-color: rgba(59,130,246,0.3) !important; }
        .btn-primary { transition: all 0.3s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99,102,241,0.5) !important; }
        input:focus { border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; }
      `}</style>

      {/* ── STICKY NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 60px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrollY > 50 ? "rgba(5,7,10,0.9)" : "transparent", backdropFilter: scrollY > 50 ? "blur(20px)" : "none", borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "all 0.4s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>◈</div>
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.5px" }}>InteriorIdeas<span style={{ color: "#3B82F6" }}>.ai</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <span onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 14, color: "#64748B", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#64748B"}>Features</span>
          <span onClick={() => document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 14, color: "#64748B", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#64748B"}>Reviews</span>
          <button onClick={scrollToForm} style={{ padding: "9px 22px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 15px rgba(59,130,246,0.3)" }} className="btn-primary">Get Started</button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "100px 60px 60px", position: "relative", overflow: "hidden" }}>

        {/* Background orbs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "8%", left: "10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", animation: "floatOrb1 9s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "0%", left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", animation: "floatOrb2 11s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "50%", right: "35%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", animation: "floatOrb3 7s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        {/* Left — Hero text */}
        <div style={{ flex: 1, maxWidth: 620, position: "relative", zIndex: 10, animation: "fadeUp 0.8s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "6px 16px", marginBottom: 32 }}>
            <div style={{ width: 7, height: 7, background: "#3B82F6", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#60A5FA", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>AI-Powered Design Studio</span>
          </div>

          <h1 style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-2.5px", marginBottom: 28 }}>
            Design your<br />perfect{" "}
            <span style={{ color: "#3B82F6", opacity: wordVisible ? 1 : 0, transform: wordVisible ? "translateY(0)" : "translateY(-14px)", display: "inline-block", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", minWidth: 10 }}>
              {ROTATING_WORDS[wordIndex]}
            </span>
            <br />with AI.
          </h1>

          <p style={{ fontSize: 18, color: "#64748B", lineHeight: 1.8, marginBottom: 48, maxWidth: 480 }}>
            Generate professional interior design concepts, furniture recommendations, and color palettes — personalized by AI in seconds.
          </p>

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 56 }}>
            <button onClick={scrollToForm} className="btn-primary" style={{ padding: "16px 36px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 30px rgba(59,130,246,0.35)", letterSpacing: "0.3px" }}>
              Start Designing Free →
            </button>
            <span style={{ fontSize: 14, color: "#475569" }}>No credit card required</span>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["🛋️ Layouts", "🎨 Palettes", "🪑 Furniture", "💡 Pro Tips", "📊 Analytics", "🖨️ PDF Export"].map(f => (
              <div key={f} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 100, padding: "8px 16px", fontSize: 13, color: "#94A3B8" }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Right — Login form */}
        <div ref={formRef} style={{ width: 460, background: "rgba(8,11,20,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "44px 48px", position: "relative", zIndex: 10, boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>

          {/* Accent line */}
          <div style={{ position: "absolute", top: 0, left: 40, right: 40, height: 2, background: "linear-gradient(90deg, transparent, #3B82F6, #6366F1, transparent)", borderRadius: 2 }} />

          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 4, marginBottom: 36 }}>
            {["Sign In", "Sign Up"].map(tab => {
              const active = (tab === "Sign In" && !isSignup) || (tab === "Sign Up" && isSignup);
              return (
                <button key={tab} onClick={() => { setIsSignup(tab === "Sign Up"); setError(""); }}
                  style={{ flex: 1, padding: "11px", border: "none", borderRadius: 9, background: active ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "transparent", color: active ? "#fff" : "#64748B", fontSize: 14, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.3s", boxShadow: active ? "0 4px 15px rgba(59,130,246,0.3)" : "none" }}>
                  {tab}
                </button>
              );
            })}
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.5px" }}>{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p style={{ fontSize: 14, color: "#64748B" }}>{isSignup ? "Join the AI design revolution." : "Sign in to your studio."}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isSignup && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                  style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11, color: "#fff", fontSize: 14, outline: "none", transition: "all 0.3s" }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11, color: "#fff", fontSize: 14, outline: "none", transition: "all 0.3s" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "1px", textTransform: "uppercase" }}>Password</label>
                {!isSignup && <button onClick={handleForgotPassword} style={{ background: "none", border: "none", color: "#3B82F6", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Forgot?</button>}
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={isSignup ? "Min. 6 characters" : "Your password"}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11, color: "#fff", fontSize: 14, outline: "none", transition: "all 0.3s" }} />
            </div>
          </div>

          {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "11px 14px", color: "#FCA5A5", fontSize: 13, marginTop: 14 }}>⚠ {error}</div>}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary"
            style={{ width: "100%", marginTop: 22, padding: "15px", background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 25px rgba(59,130,246,0.35)" }}>
            {loading ? "Processing..." : isSignup ? "Create Account →" : "Sign In to Studio →"}
          </button>

          <p style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "#475569" }}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <span onClick={() => { setIsSignup(!isSignup); setError(""); }} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: 700 }}>
              {isSignup ? "Sign In" : "Sign Up Free"}
            </span>
          </p>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>🔒</span>
            <span style={{ fontSize: 12, color: "#334155" }}>Secured by Supabase Auth</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "40px 60px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 100, flexWrap: "wrap" }}>
          {[["500+", "Designs Generated"], ["98%", "Satisfaction Rate"], ["6", "Room Types"], ["50+", "Design Styles"]].map(([num, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-1.5px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
              <div style={{ fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "1px", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" style={{ padding: "120px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ display: "inline-block", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "6px 16px", fontSize: 11, color: "#60A5FA", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>Features</div>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-2px", marginBottom: 16 }}>Everything you need to<br /><span style={{ color: "#3B82F6" }}>design perfectly.</span></h2>
          <p style={{ fontSize: 18, color: "#64748B", maxWidth: 500, margin: "0 auto" }}>One platform for all your interior design needs, powered by advanced AI.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card-hover" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "36px 32px" }}>
              <div style={{ fontSize: 36, marginBottom: 20, background: "rgba(59,130,246,0.08)", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, border: "1px solid rgba(59,130,246,0.12)" }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 60px 120px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ display: "inline-block", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "6px 16px", fontSize: 11, color: "#818CF8", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>Process</div>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-2px" }}>How it <span style={{ color: "#6366F1" }}>works.</span></h2>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 0, maxWidth: 900, margin: "0 auto", alignItems: "flex-start" }}>
          {[
            { step: "01", title: "Configure", desc: "Choose your room type, design style, color palette, and budget." },
            { step: "02", title: "Generate", desc: "Our AI processes your preferences and crafts a full design concept." },
            { step: "03", title: "Save & Export", desc: "Save to your gallery, export as PDF, or start a new design." },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ width: 60, height: 60, background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#818CF8", margin: "0 auto 20px" }}>{s.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, maxWidth: 220, margin: "0 auto" }}>{s.desc}</p>
              </div>
              {i < 2 && <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, rgba(99,102,241,0.3), transparent)", marginTop: 30, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: "80px 60px 120px" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ display: "inline-block", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "6px 16px", fontSize: 11, color: "#60A5FA", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20 }}>Reviews</div>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-2px" }}>Loved by <span style={{ color: "#3B82F6" }}>designers.</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="card-hover" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "36px 32px" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: "#F59E0B", fontSize: 16 }}>★</span>)}
              </div>
              <p style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.75, marginBottom: 28, fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: "80px 60px 120px", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 28, padding: "80px 60px", maxWidth: 800, margin: "0 auto", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #3B82F6, #6366F1, transparent)" }} />
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-2px", marginBottom: 16 }}>Ready to design your<br /><span style={{ color: "#3B82F6" }}>dream space?</span></h2>
          <p style={{ fontSize: 18, color: "#64748B", marginBottom: 40 }}>Join designers who use AI to create stunning interiors in seconds.</p>
          <button onClick={scrollToForm} className="btn-primary" style={{ padding: "18px 48px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 14, color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 30px rgba(59,130,246,0.4)" }}>
            Start Designing Free →
          </button>
          <div style={{ marginTop: 20, fontSize: 14, color: "#334155" }}>No credit card required · Free to start</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "60px 60px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48, flexWrap: "wrap", gap: 40 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>◈</div>
              <span style={{ fontSize: 18, fontWeight: 700 }}>InteriorIdeas<span style={{ color: "#3B82F6" }}>.ai</span></span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>AI-powered interior design platform. Generate professional concepts in seconds.</p>
          </div>
          <div style={{ display: "flex", gap: 80, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 20 }}>Product</div>
              {["Features", "How it Works", "Analytics", "Export PDF"].map(l => (
                <div key={l} style={{ fontSize: 14, color: "#475569", marginBottom: 12, cursor: "pointer" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#475569"}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 20 }}>Company</div>
              {["About", "Reviews", "Privacy Policy", "Terms of Service"].map(l => (
                <div key={l} style={{ fontSize: 14, color: "#475569", marginBottom: 12, cursor: "pointer" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#475569"}>{l}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#334155" }}>© 2026 InteriorIdeas.ai — All rights reserved.</span>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms", "Support"].map(l => (
              <span key={l} style={{ fontSize: 13, color: "#334155", cursor: "pointer" }} onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#334155"}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}