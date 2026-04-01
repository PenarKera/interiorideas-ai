"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

const ROOMS = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Home Office", "Dining Room"];
const STYLES = ["Minimalist", "Scandinavian", "Industrial", "Bohemian", "Mediterranean", "Modern Luxury"];
const PALETTES = ["Earth Tones", "Nordic Frost", "Terracotta", "Sage & Linen", "Monochrome", "Jewel Tones"];
const BUDGETS = ["$500 – $1,500", "$1,500 – $5,000", "$5,000 – $15,000", "$15,000+"];
const ROOM_ICONS = { "Living Room": "🛋️", "Bedroom": "🛏️", "Kitchen": "🍳", "Bathroom": "🚿", "Home Office": "💼", "Dining Room": "🍽️" };

const NAV = [
  { id: "design",  label: "Studio",    icon: "⬡" },
  { id: "history", label: "Gallery",   icon: "◫" },
  { id: "stats",   label: "Analytics", icon: "◈" },
];

export default function Home() {
  const [form, setForm] = useState({ room: "Living Room", style: "Minimalist", palette: "Earth Tones", budget: "$1,500 – $5,000", extra: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("design");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else setUser(session.user);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setHistory(data || []);
    setHistoryLoading(false);
  };

  useEffect(() => {
    if ((activeTab === "history" || activeTab === "stats") && user) fetchHistory();
  }, [activeTab, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSubmit = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      setResult(data.design);
      setTimeout(() => setActiveStep(2), 100);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    setSaving(true);
    const { error } = await supabase.from("designs").insert({
      user_id: user.id, room: form.room, style: form.style, palette: form.palette, budget: form.budget,
      concept_title: result.concept_title, concept_description: result.concept_description,
      key_elements: result.key_elements, furniture: result.furniture, color_tips: result.color_tips, pro_tip: result.pro_tip,
    });
    setSaving(false);
    if (!error) { setSavedMsg(true); setTimeout(() => setSavedMsg(false), 3000); }
  };

  const handleDeleteDesign = async (id) => {
    await supabase
      .from("designs")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id);
    setHistory(history.filter(d => d.id !== id));
  };

  const handleLoadDesign = (design) => {
    setResult({ concept_title: design.concept_title, concept_description: design.concept_description, key_elements: design.key_elements, furniture: design.furniture, color_tips: design.color_tips, pro_tip: design.pro_tip });
    setForm({ room: design.room, style: design.style, palette: design.palette, budget: design.budget, extra: "" });
    setActiveTab("design"); setActiveStep(2);
  };

  const handlePrint = () => window.print();

  const filteredHistory = history.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.concept_title?.toLowerCase().includes(q) || d.room?.toLowerCase().includes(q) || d.style?.toLowerCase().includes(q);
  });

  const stats = {
    total: history.length,
    thisMonth: history.filter(d => new Date(d.created_at).getMonth() === new Date().getMonth()).length,
    topRoom: history.length ? [...history].sort((a, b) => history.filter(d => d.room === b.room).length - history.filter(d => d.room === a.room).length)[0]?.room : "—",
    topStyle: history.length ? [...history].sort((a, b) => history.filter(d => d.style === b.style).length - history.filter(d => d.style === a.style).length)[0]?.style : "—",
    roomCounts: ROOMS.map(r => ({ name: r, count: history.filter(d => d.room === r).length })).filter(r => r.count > 0).sort((a, b) => b.count - a.count),
    styleCounts: STYLES.map(s => ({ name: s, count: history.filter(d => d.style === s).length })).filter(s => s.count > 0).sort((a, b) => b.count - a.count),
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#05070A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      {/* Premium Loader */}
      <div style={{ position: "relative", width: 44, height: 44 }}>
        <div style={{ position: "absolute", width: "100%", height: "100%", border: "2px solid rgba(59,130,246,0.1)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", width: "100%", height: "100%", border: "2px solid transparent", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite" }} />
      </div>
      <p style={{ color: "#64748B", fontSize: 13, fontFamily: "var(--font-sans)", letterSpacing: "2px", textTransform: "uppercase" }}>Initializing Workspace</p>
    </div>
  );

  const userName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Designer";
  const userInitial = userName[0].toUpperCase();
  const sidebarW = sidebarCollapsed ? 80 : 260;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#05070A", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden" }}>

      {/* Ambient background glows mapped to login page vibe */}
      <div style={{ position: "absolute", top: "-200px", left: "-200px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-300px", right: "-100px", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />

      {/* ─── PREMIUM COLLAPSIBLE SIDEBAR ─── */}
      <aside className="no-print glass-panel" style={{
        width: sidebarW, flexShrink: 0, 
        borderRight: "1px solid var(--border)", borderLeft: "none", borderTop: "none", borderBottom: "none",
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
        transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)", zIndex: 50
      }}>
        {/* Logo area */}
        <div style={{ padding: sidebarCollapsed ? "28px 0" : "28px 24px", display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "space-between", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
              <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 700, flexShrink: 0, boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>◈</div>
              <div style={{ whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>InteriorIdeas<span style={{ color: "#3B82F6" }}>.ai</span></div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 700, boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>◈</div>
          )}
          
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ position: sidebarCollapsed ? "static" : "absolute", right: "-12px", width: 24, height: 24, background: "#0F1423", border: "1px solid var(--border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94A3B8", fontSize: 14, transition: "all 0.3s", zIndex: 60, marginTop: sidebarCollapsed ? 20 : 0 }}>
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {!sidebarCollapsed && (
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "1.5px", textTransform: "uppercase", padding: "0 12px", marginBottom: 8 }}>Workspace</div>
          )}
          {NAV.map(({ id, label, icon }) => {
            const isActive = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                title={sidebarCollapsed ? label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: sidebarCollapsed ? "12px 0" : "12px 16px",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  background: isActive ? "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, transparent 100%)" : "transparent",
                  borderLeft: isActive ? "3px solid #3B82F6" : "3px solid transparent",
                  borderRadius: sidebarCollapsed ? 12 : 0, 
                  cursor: "pointer", color: isActive ? "#fff" : "var(--text-secondary)", border: "none",
                  fontSize: 14, fontWeight: isActive ? 600 : 500, width: "100%", transition: "all 0.2s", textAlign: "left",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "var(--text-secondary)"; }}>
                <span style={{ fontSize: 18, flexShrink: 0, color: isActive ? "#3B82F6" : "inherit" }}>{icon}</span>
                {!sidebarCollapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div ref={dropdownRef} style={{ padding: "20px 16px", borderTop: "1px solid rgba(255,255,255,0.03)", position: "relative" }}>
          <button onClick={() => setShowDropdown(!showDropdown)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, cursor: "pointer", justifyContent: sidebarCollapsed ? "center" : "flex-start", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
            <div style={{ width: 34, height: 34, background: "#1E293B", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0, border: "1px solid #334155" }}>{userInitial}</div>
            {!sidebarCollapsed && (
              <div style={{ textAlign: "left", overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Pro Studio</div>
              </div>
            )}
          </button>

          {/* Settings Dropdown */}
          {showDropdown && (
            <div style={{ position: "absolute", bottom: "calc(100% + 12px)", left: 16, right: 16, background: "#0F1423", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease", zIndex: 200, overflow: "hidden", backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{user.email}</div>
              </div>
              <div style={{ padding: "8px" }}>
                <button onClick={handleLogout}
                  style={{ width: "100%", padding: "10px 12px", background: "transparent", border: "none", borderRadius: 8, color: "var(--danger)", cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span>↩</span> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 10 }}>

        {/* Premium Top Bar */}
        <header className="no-print glass-panel" style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid rgba(255,255,255,0.03)", borderTop: "none", borderLeft: "none", borderRight: "none" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "var(--font-serif)" }}>{NAV.find(n => n.id === activeTab)?.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2, letterSpacing: "0.5px" }}>
              {activeTab === "design" ? `Design studio active` : activeTab === "history" ? `You have ${history.length} saved layouts.` : "Performance metrics"}
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
             {activeTab !== "design" && (
                <button onClick={() => setActiveTab("design")}
                  style={{ padding: "10px 20px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s", boxShadow: "0 4px 15px rgba(59,130,246,0.2)" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 15px rgba(59,130,246,0.2)"}>
                  ✦ Start Designing
                </button>
              )}
             <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 16px", fontWeight: 500 }}>
               {new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
             </div>
          </div>
        </header>

        {/* Dynamic Canvas */}
        <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>

          {/* ─── ANALYTICS ─── */}
          {activeTab === "stats" && (
            <div style={{ animation: "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)", maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: "inline-block", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "4px 12px", fontSize: 10, color: "#3B82F6", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Intelligence</div>
                <h1 style={{ fontSize: 38, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1px" }}>Studio <span style={{ color: "#3B82F6" }}>Metrics</span></h1>
              </div>

              {/* Stat grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
                {[
                  { label: "Total renders", value: stats.total, icon: "🎨", color: "#3B82F6" },
                  { label: "This month", value: stats.thisMonth, icon: "📅", color: "#6366F1" },
                  { label: "Top canvas", value: stats.topRoom, icon: "🏠", color: "#06B6D4" },
                  { label: "Signature style", value: stats.topStyle, icon: "✨", color: "#F59E0B" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="glass-card" style={{ padding: "28px 24px", borderRadius: 20, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: `linear-gradient(90deg, ${color}, transparent)` }} />
                    <div style={{ fontSize: 22, marginBottom: 16, background: "rgba(255,255,255,0.03)", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>{icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-1px" }}>{value || "—"}</div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>

              {stats.roomCounts.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {[
                    { title: "Spaces Designed", data: stats.roomCounts, color: "#3B82F6" },
                    { title: "Aesthetics Applied", data: stats.styleCounts, color: "#6366F1" },
                  ].map(({ title, data, color }) => (
                    <div key={title} className="glass-card" style={{ padding: 32, borderRadius: 24 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />{title}
                      </div>
                      {data.map(({ name, count }) => (
                        <div key={name} style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>{name}</span>
                            <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{count}</span>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(count / stats.total) * 100}%`, background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.8))`, borderRadius: 10, transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: "80px 40px", borderRadius: 24, textAlign: "center" }}>
                   <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>📊</div>
                   <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Insufficient Data</div>
                   <div style={{ fontSize: 15, color: "var(--text-tertiary)", marginBottom: 30 }}>Launch a new generative design to begin tracking.</div>
                   <button onClick={() => setActiveTab("design")} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}>Enter Studio →</button>
                </div>
              )}
            </div>
          )}

          {/* ─── HISTORY (GALLERY) ─── */}
          {activeTab === "history" && (
            <div style={{ animation: "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)", maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ marginBottom: 36, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ display: "inline-block", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "4px 12px", fontSize: 10, color: "#3B82F6", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Archives</div>
                  <h1 style={{ fontSize: 38, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1px" }}>Design <span style={{ color: "#3B82F6" }}>Gallery</span></h1>
                </div>
              </div>

              <div style={{ position: "relative", marginBottom: 32 }}>
                <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", fontSize: 16 }}>🔍</span>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search your library..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 20px 16px 48px", color: "#fff", fontSize: 15, outline: "none", transition: "all 0.3s", backdropFilter: "blur(10px)" }}
                  onFocus={e => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }} />
              </div>

              {historyLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "40px", color: "var(--text-secondary)", fontSize: 15, justifyContent: "center" }}>
                   <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Fetching archives...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="glass-card" style={{ padding: "80px 40px", borderRadius: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>{searchQuery ? "🔍" : "🖼️"}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{searchQuery ? "No matching renders" : "Empty Gallery"}</div>
                  <div style={{ fontSize: 15, color: "var(--text-tertiary)", marginBottom: 30 }}>{searchQuery ? `No concepts found for "${searchQuery}"` : "Create your first AI masterplan to populate the gallery."}</div>
                  {!searchQuery && <button onClick={() => setActiveTab("design")} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}>Enter Studio →</button>}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {filteredHistory.map(design => (
                    <div key={design.id} className="glass-card"
                      style={{ borderRadius: 20, padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", transition: "all 0.3s" }}>
                      <div style={{ flex: 1, paddingRight: 30 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                          {[design.room, design.style].map(tag => (
                            <span key={tag} style={{ background: "rgba(59,130,246,0.1) ", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>{tag}</span>
                          ))}
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: 6 }}>{new Date(design.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 10px", fontFamily: "var(--font-serif)", letterSpacing: "0.5px" }}>{design.concept_title}</h3>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, paddingRight: 40 }}>{design.concept_description?.slice(0, 150)}...</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                        <button onClick={() => handleLoadDesign(design)}
                          style={{ padding: "10px 24px", background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, color: "#60A5FA", cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all 0.2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#3B82F6"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))"; e.currentTarget.style.color = "#60A5FA"; }}>
                          Open
                        </button>
                        <button onClick={() => handleDeleteDesign(design.id)}
                          style={{ padding: "10px 24px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 10, color: "var(--danger)", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "var(--danger)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.1)"; }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── DESIGN STUDIO ─── */}
          {activeTab === "design" && (
            <div style={{ maxWidth: 940, margin: "0 auto" }}>
              {/* Heading */}
              {!result && (
                <div style={{ marginBottom: 40, animation: "fadeIn 0.5s ease" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 20 }}>
                    <div style={{ width: 8, height: 8, background: "#3B82F6", borderRadius: "50%", boxShadow: "0 0 8px #3B82F6" }} />
                    <span style={{ fontSize: 10, color: "#60A5FA", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>AI generation ready</span>
                  </div>
                  <h1 style={{ fontSize: 48, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1.5px", lineHeight: 1.1 }}>
                    Setup your <br/><span style={{ background: "linear-gradient(to right, #3B82F6, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>masterplan.</span>
                  </h1>
                </div>
              )}

              {/* Progress Steps */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 36, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "16px 32px", backdropFilter: "blur(12px)" }}>
                {["Configuration", "Processing", "Masterpiece"].map((step, i) => (
                  <div key={step} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: i + 1 <= activeStep ? "#3B82F6" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: i + 1 <= activeStep ? "#fff" : "var(--text-tertiary)", fontWeight: 700, flexShrink: 0, transition: "all 0.5s", boxShadow: i + 1 <= activeStep ? "0 0 15px rgba(59,130,246,0.5)" : "none" }}>
                        {i + 1 < activeStep ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: 13, color: i + 1 <= activeStep ? "#fff" : "var(--text-tertiary)", fontWeight: i + 1 <= activeStep ? 600 : 500, letterSpacing: "0.5px", transition: "color 0.5s" }}>{step}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 2, background: i + 1 < activeStep ? "linear-gradient(90deg, #3B82F6, rgba(59,130,246,0.2))" : "rgba(255,255,255,0.05)", margin: "0 20px", borderRadius: 2, transition: "background 0.5s" }} />}
                  </div>
                ))}
              </div>

              {/* FORM */}
              {!result && !loading && (
                <div className="glass-card" style={{ borderRadius: 24, padding: 40, animation: "slideIn 0.5s ease" }}>
                  <div style={{ marginBottom: 36 }}>
                     <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Select Canvas (Room)</label>
                     <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                        {ROOMS.map(r => {
                          const isSel = form.room === r;
                          return (
                            <button key={r} onClick={() => setForm({...form, room: r})}
                              style={{ 
                                padding: "20px 10px", 
                                background: isSel ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)", 
                                border: isSel ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)", 
                                borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                                transition: "all 0.2s", boxShadow: isSel ? "0 0 20px rgba(59,130,246,0.2)" : "none"
                              }}
                              onMouseEnter={e => { if(!isSel) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; } }}
                              onMouseLeave={e => { if(!isSel) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; } }}>
                              <span style={{ fontSize: 26, filter: isSel ? "drop-shadow(0 0 8px rgba(59,130,246,0.8))" : "grayscale(30%)", transition: "all 0.3s" }}>{ROOM_ICONS[r]}</span>
                              <span style={{ fontSize: 11, fontWeight: isSel ? 700 : 500, color: isSel ? "#fff" : "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r}</span>
                            </button>
                          );
                        })}
                     </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 32 }}>
                    {[["style","Aesthetic",STYLES],["palette","Color Grade",PALETTES],["budget","Budget Tier",BUDGETS]].map(([key,label,opts]) => (
                      <div key={key}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 12 }}>{label}</label>
                        <select
                          style={{ width: "100%", background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 20px", color: "#fff", fontSize: 15, cursor: "pointer", outline: "none", transition: "all 0.3s", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='10' viewBox='0 0 12 8'%3E%3Cpath fill='%2364748B' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
                          value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} disabled={loading}
                          onFocus={e => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.15)"; }}
                          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}>
                          {opts.map(o => <option key={o} style={{ background: "#0D121F" }}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 36 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                      Specific Directives <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--text-tertiary)" }}>(optional)</span>
                    </label>
                    <textarea
                      style={{ width: "100%", background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 20px", color: "#fff", fontSize: 15, resize: "vertical", outline: "none", transition: "all 0.3s", lineHeight: 1.6 }}
                      placeholder="Special requirements, e.g. pet-friendly fabrics, lots of natural light..."
                      value={form.extra} onChange={e => setForm({...form,extra:e.target.value})} disabled={loading} rows={3}
                      onFocus={e => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }} />
                  </div>

                  {error && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "16px 24px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center" }}>
                      <span style={{ color: "var(--danger)", fontSize: 20 }}>⚠</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Error in processing</div>
                        <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div>
                      </div>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={loading}
                    style={{ width: "100%", padding: "18px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "1px", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 8px 30px rgba(59,130,246,0.4)" }}
                    onMouseEnter={e => { if(!loading) { e.currentTarget.style.boxShadow = "0 10px 40px rgba(99,102,241,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(59,130,246,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    INITIATE AI RENDER ✦
                  </button>
                </div>
              )}

              {/* PROCESSING STATE */}
              {loading && (
                <div className="glass-card" style={{ padding: "60px", borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.5s ease", textAlign: "center" }}>
                  <div style={{ position: "relative", width: 80, height: 80, marginBottom: 30 }}>
                    <div style={{ position: "absolute", inset: 0, border: "3px solid rgba(255,255,255,0.05)", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", inset: 0, border: "3px solid transparent", borderTopColor: "#3B82F6", borderRightColor: "#6366F1", borderRadius: "50%", animation: "spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite" }} />
                    <div style={{ position: "absolute", inset: 15, background: "radial-gradient(circle, rgba(59,130,246,0.4), transparent)", borderRadius: "50%", animation: "pulseGlow 2s infinite" }} />
                  </div>
                  <h2 style={{ fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 12, letterSpacing: "-0.5px" }}>Synthesizing Masterplan</h2>
                  <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 300, lineHeight: 1.5 }}>Our AI is calculating layout physics, matching textures, and mapping {form.palette} hues for your {form.style} space.</p>
                </div>
              )}

              {/* RESULT (THE MASTERPIECE) */}
              {result && !loading && (
                <div style={{ animation: "slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                  {savedMsg && (
                    <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 16, padding: "16px 24px", marginBottom: 20, color: "#34D399", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(10px)" }}>
                      ✓ Masterplan secured to your gallery.
                    </div>
                  )}

                  <div className="print-card glass-card" style={{ borderRadius: 24, overflow: "hidden", marginBottom: 24 }}>
                    {/* Header */}
                    <div style={{ padding: "40px 48px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 30 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60A5FA", boxShadow: "0 0 10px #60A5FA" }} /> Render Complete
                          </div>
                          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "var(--font-serif)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{result.concept_title}</h2>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0, maxWidth: 200 }}>
                          {[form.room, form.style, form.budget].map(tag => (
                            <span key={tag} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "48px" }}>
                      <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 40, letterSpacing: "0.2px" }}>{result.concept_description}</p>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 }}>
                        {/* Elements */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 4, height: 16, background: "#3B82F6", borderRadius: 4, boxShadow: "0 0 10px #3B82F6" }} /> Core Elements
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {result.key_elements?.map((el, i) => (
                              <span key={i} style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "8px 16px", fontSize: 14, color: "#93C5FD", fontWeight: 500 }}>{el}</span>
                            ))}
                          </div>
                        </div>

                        {/* Colors */}
                        {result.color_tips && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 4, height: 16, background: "#8B5CF6", borderRadius: 4, boxShadow: "0 0 10px #8B5CF6" }} /> Palette Integration
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                              {result.color_tips.map((tip, i) => (
                                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                  <span style={{ color: "#8B5CF6", fontSize: 18, lineHeight: 1 }}>◈</span>
                                  <span style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{tip}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Furniture */}
                      <div style={{ marginBottom: 44 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 4, height: 16, background: "#06B6D4", borderRadius: 4, boxShadow: "0 0 10px #06B6D4" }} /> Curated Pieces
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {result.furniture?.map((f, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.3s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.02)"}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>{f.item}</div>
                                <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>{f.description}</div>
                              </div>
                              <div style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, padding: "8px 18px", color: "#67E8F9", fontWeight: 800, fontSize: 15, marginLeft: 20, whiteSpace: "nowrap" }}>{f.approx_price}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Tip */}
                      {result.pro_tip && (
                        <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "32px 36px", position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "linear-gradient(to bottom, #3B82F6, #6366F1)" }} />
                          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2px", color: "#60A5FA", marginBottom: 12, textTransform: "uppercase" }}>Director's Insight</div>
                          <p style={{ fontSize: 16, color: "#E2E8F0", fontStyle: "italic", lineHeight: 1.8, margin: 0 }}>"{result.pro_tip}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="no-print" style={{ display: "flex", gap: 16 }}>
                    <button onClick={() => { setResult(null); setActiveStep(1); }}
                      style={{ flex: 1, padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                      ← Reset Studio Canvas
                    </button>
                    <button onClick={handleSave} disabled={saving || savedMsg}
                      style={{ flex: 1, padding: "18px", background: savedMsg ? "rgba(16,185,129,0.1)" : "linear-gradient(135deg, #3B82F6, #6366F1)", border: savedMsg ? "1px solid rgba(16,185,129,0.3)" : "none", borderRadius: 16, color: savedMsg ? "#34D399" : "#fff", fontSize: 15, fontWeight: 800, cursor: saving || savedMsg ? "not-allowed" : "pointer", transition: "all 0.3s", boxShadow: savedMsg || saving ? "none" : "0 8px 30px rgba(59,130,246,0.4)" }}
                      onMouseEnter={e => { if (!saving && !savedMsg) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(99,102,241,0.6)"; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = savedMsg || saving ? "none" : "0 8px 30px rgba(59,130,246,0.4)"; }}>
                      {savedMsg ? "✓ SECURED" : saving ? "SAVING..." : "COMMIT DESIGN ✓"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}