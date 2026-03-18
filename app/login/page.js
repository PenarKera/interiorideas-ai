"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const router = useRouter();

  const validate = () => {
    if (isSignup && name.trim().length < 2) { setError("Emri duhet të ketë 2+ karaktere!"); return false; }
    if (!email.includes("@")) { setError("Email i pavlefshëm!"); return false; }
    if (password.length < 6) { setError("Fjalëkalimi duhet 6+ karaktere!"); return false; }
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
        alert("✅ Kontrollo emailin!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 20 }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #7B4FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6 }}>◈ InteriorIdeas.ai</div>
          <div style={{ fontSize: 13, color: "#6B6B8A" }}>{isSignup ? "Krijo llogarinë" : "Mirë se erdhe"}</div>
        </div>
        {isSignup && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#8B8BAA", display: "block", marginBottom: 8 }}>EMRI</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 10, padding: "12px 16px", color: "#E0D9FF", fontSize: 14, boxSizing: "border-box" }} placeholder="Emri juaj" />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#8B8BAA", display: "block", marginBottom: 8 }}>EMAIL</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 10, padding: "12px 16px", color: "#E0D9FF", fontSize: 14, boxSizing: "border-box" }} placeholder="emri@email.com" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: "#8B8BAA", display: "block", marginBottom: 8 }}>FJALËKALIMI</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 10, padding: "12px 16px", color: "#E0D9FF", fontSize: 14, boxSizing: "border-box" }} placeholder="Min. 6 karaktere" />
        </div>
        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#FCA5A5", fontSize: 13, marginBottom: 16 }}>❌ {error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #7B4FFF, #C084FC)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          {loading ? "Duke u ngarkuar..." : isSignup ? "✦ Regjistrohu" : "✦ Hyr"}
        </button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B6B8A" }}>
          {isSignup ? "Ke llogari?" : "Nuk ke llogari?"}{" "}
          <span onClick={() => { setIsSignup(!isSignup); setError(""); }} style={{ color: "#C084FC", cursor: "pointer", fontWeight: 600 }}>
            {isSignup ? "Hyr" : "Regjistrohu falas"}
          </span>
        </div>
      </div>
    </div>
  );
}