"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const ROOMS = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Home Office", "Dining Room"];
const STYLES = ["Minimalist", "Scandinavian", "Industrial", "Bohemian", "Mediterranean", "Modern Luxury"];
const PALETTES = ["Earth Tones", "Nordic Frost", "Terracotta", "Sage & Linen", "Monochrome", "Jewel Tones"];
const BUDGETS = ["$500 - $1,500", "$1,500 - $5,000", "$5,000 - $15,000", "$15,000+"];

export default function Home() {
  const [form, setForm] = useState({ room: "Living Room", style: "Minimalist", palette: "Earth Tones", budget: "$1,500 - $5,000", extra: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else setUser(session.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSubmit = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API failed.");
      setResult(data.design);
    } catch (err) { setError("❌ " + err.message); }
    finally { setLoading(false); }
  };

  if (!user) return <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", color: "#E0D9FF" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#E0D9FF", fontFamily: "system-ui" }}>
      <header style={{ background: "rgba(15,10,30,0.95)", borderBottom: "1px solid rgba(120,80,255,0.2)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #7B4FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>◈ InteriorIdeas.ai</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#4B4B6A" }}>{user.email}</span>
          <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "6px 14px", color: "#FCA5A5", cursor: "pointer", fontSize: 12 }}>Logout</button>
        </div>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7B4FFF", fontWeight: 700, marginBottom: 16 }}>📝 DESIGN PREFERENCES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[["room","Room",ROOMS],["style","Style",STYLES],["palette","Color Palette",PALETTES],["budget","Budget",BUDGETS]].map(([key,label,opts]) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: "#6B6B8A", display: "block", marginBottom: 6 }}>{label}</label>
                <select style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 8, padding: "10px 14px", color: "#E0D9FF", fontSize: 14 }} value={form[key]} onChange={(e) => setForm({...form,[key]:e.target.value})} disabled={loading}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: "#6B6B8A", display: "block", marginBottom: 6 }}>Additional Notes (optional)</label>
            <textarea style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 8, padding: "10px 14px", color: "#E0D9FF", fontSize: 13, resize: "vertical", fontFamily: "system-ui" }} placeholder="E.g: I have two kids, need practical space..." value={form.extra} onChange={(e) => setForm({...form,extra:e.target.value})} disabled={loading} rows={3} />
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginTop: 20, padding: 15, background: "linear-gradient(135deg, #7B4FFF, #C084FC)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "⏳ Generating..." : "✦ Generate Design"}
          </button>
        </div>
        {loading && <div style={{ background: "rgba(123,79,255,0.08)", border: "1px solid rgba(123,79,255,0.25)", borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}><div style={{ width: 32, height: 32, border: "3px solid rgba(123,79,255,0.2)", borderTopColor: "#7B4FFF", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} /><div><div style={{ fontWeight: 700, fontSize: 15 }}>AI is working...</div><div style={{ fontSize: 13, color: "#7B6BAA" }}>Generating your design</div></div></div>}
        {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}><div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>⚠️ Error</div><div style={{ fontSize: 13, color: "#FCA5A5" }}>{error}</div><button onClick={() => setError("")} style={{ marginTop: 12, padding: "8px 18px", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, color: "#FCA5A5", cursor: "pointer", fontSize: 13 }}>Try Again</button></div>}
        {result && !loading && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(123,79,255,0.2)", borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7B4FFF", fontWeight: 700, marginBottom: 16 }}>✅ AI RESPONSE</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px", color: "#E0D9FF" }}>{result.concept_title}</h2>
            <p style={{ fontSize: 14, color: "#8B8BAA", lineHeight: 1.7, marginBottom: 20 }}>{result.concept_description}</p>
            <div style={{ marginBottom: 20 }}><div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#7B4FFF", fontWeight: 700, marginBottom: 10 }}>KEY ELEMENTS</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{result.key_elements?.map((el,i) => <span key={i} style={{ background: "rgba(123,79,255,0.15)", border: "1px solid rgba(123,79,255,0.3)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#C084FC" }}>{el}</span>)}</div></div>
            <div style={{ marginBottom: 20 }}><div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#7B4FFF", fontWeight: 700, marginBottom: 10 }}>FURNITURE</div>{result.furniture?.map((f,i) => <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 700, fontSize: 14 }}>{f.item}</div><div style={{ fontSize: 12, color: "#6B6B8A" }}>{f.description}</div></div><span style={{ color: "#C084FC", fontWeight: 700 }}>{f.approx_price}</span></div>)}</div>
            <button onClick={() => setResult(null)} style={{ width: "100%", padding: 14, background: "rgba(123,79,255,0.15)", border: "1px solid rgba(123,79,255,0.3)", borderRadius: 10, color: "#C084FC", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Generate New Design</button>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}