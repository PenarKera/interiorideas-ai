"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Kjo pjesë kap token-in nga URL pa e prishur dizajnin
    const setupSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsReady(true);
      } else {
        // Nëse vjen pa seancë, e kthejmë te login pas 3 sekondave
        setError("Session expired or invalid link.");
        setTimeout(() => router.push("/login"), 3000);
      }
    };
    setupSession();
  }, [router]);

  const handleUpdate = async () => {
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
    } else {
      alert("✅ Password updated!");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05070A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
      
      {/* Background Glow - I njëjti stil si te Login */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)", filter: "blur(90px)", borderRadius: "50%", zIndex: 0 }} />

      <div style={{ width: "100%", maxWidth: "400px", background: "#080B14", padding: "40px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", zIndex: 1, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontWeight: "bold", fontSize: "20px", boxShadow: "0 8px 20px rgba(59,130,246,0.3)" }}>◈</div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "10px", letterSpacing: "-0.5px" }}>Secure Update</h2>
          <p style={{ color: "#64748B", fontSize: "14px" }}>Set a new password for your AI studio.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <input 
            type="password" 
            placeholder="New Password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: "15px 18px", background: "#0D121F", border: "1px solid #1E293B", borderRadius: "14px", color: "#fff", outline: "none", fontSize: "14px" }} 
          />

          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "15px 18px", background: "#0D121F", border: "1px solid #1E293B", borderRadius: "14px", color: "#fff", outline: "none", fontSize: "14px" }} 
          />

          {error && <div style={{ color: "#F87171", fontSize: "12px", textAlign: "center", padding: "12px", background: "rgba(248,113,113,0.08)", borderRadius: "10px", border: "1px solid rgba(248,113,113,0.2)" }}>{error}</div>}

          <button 
            onClick={handleUpdate} 
            disabled={loading || !isReady}
            style={{ width: "100%", padding: "16px", background: "#3B82F6", color: "#fff", borderRadius: "14px", border: "none", fontWeight: 700, fontSize: "16px", cursor: isReady ? "pointer" : "not-allowed", marginTop: "8px", boxShadow: "0 4px 14px rgba(59,130,246,0.2)", opacity: isReady ? 1 : 0.6 }}
          >
            {loading ? "Processing..." : "Reset Password →"}
          </button>
        </div>
      </div>
    </div>
  );
}