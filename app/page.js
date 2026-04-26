"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, supabaseConfigError } from "../lib/supabase";
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
  const [photos, setPhotos] = useState([]);
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
  const authUnavailable = !supabase;

  useEffect(() => {
    let active = true;

    if (!supabase) {
      setError(supabaseConfigError || "Authentication is currently unavailable.");
      return undefined;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        if (!session) router.push("/login");
        else setUser(session.user);
      })
      .catch((sessionError) => {
        console.error("Unable to restore session:", sessionError);
        if (active) {
          setError("We could not restore your session. Please sign in again.");
          router.push("/login");
        }
      });

    return () => {
      active = false;
    };
  }, [router, authUnavailable]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user || !supabase) return;
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setHistory(data || []);
    else setError("Unable to load your saved designs right now.");
    setHistoryLoading(false);
  }, [user]);

  useEffect(() => {
    if ((activeTab === "history" || activeTab === "stats") && user) fetchHistory();
  }, [activeTab, user, fetchHistory]);

  const handleLogout = async () => {
    if (!supabase) {
      setError(supabaseConfigError || "Authentication is currently unavailable.");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setPhotos([]);
    setActiveStep(1);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      setResult(data.design);
      setPhotos(data.photos || []);
      setActiveStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user || !supabase) {
      if (!supabase) {
        setError(supabaseConfigError || "Saving is unavailable until Supabase is configured.");
      }
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("designs").insert({
      user_id: user.id,
      room: form.room,
      style: form.style,
      palette: form.palette,
      budget: form.budget,
      concept_title: result.concept_title,
      concept_description: result.concept_description,
      key_elements: result.key_elements,
      furniture: result.furniture,
      color_tips: result.color_tips,
      pro_tip: result.pro_tip,
      photos: photos,
    });
    setSaving(false);
    if (!error) {
      setSavedMsg(true);
      setActiveStep(3);
      setTimeout(() => setSavedMsg(false), 3000);
    } else {
      console.error("Supabase Error:", error.message);
      setError("Failed to save design.");
    }
  };

  const handleDeleteDesign = async (id) => {
    if (!supabase) {
      setError(supabaseConfigError || "Deleting is unavailable until Supabase is configured.");
      return;
    }
    await supabase.from("designs").delete().eq("id", id).eq("user_id", user?.id);
    setHistory(history.filter(d => d.id !== id));
  };

  const handleLoadDesign = (design) => {
    setResult({
      concept_title: design.concept_title,
      concept_description: design.concept_description,
      key_elements: design.key_elements,
      furniture: design.furniture,
      color_tips: design.color_tips,
      pro_tip: design.pro_tip,
    });
    setForm({ room: design.room, style: design.style, palette: design.palette, budget: design.budget, extra: "" });
    setPhotos(design.photos || []);
    setActiveTab("design");
    setActiveStep(2);
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
    <div style={{ minHeight: "100vh", background: "#05070A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, padding: 24, textAlign: "center" }}>
      {authUnavailable ? (
        <>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.18))", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#FCA5A5" }}>
            !
          </div>
          <div style={{ maxWidth: 440, background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
            <h1 style={{ fontSize: 26, color: "#fff", marginBottom: 10 }}>Authentication unavailable</h1>
            <p style={{ color: "#94A3B8", lineHeight: 1.7, marginBottom: 18 }}>
              {error || supabaseConfigError || "We could not initialize Supabase for this project."}
            </p>
            <button
              onClick={() => router.push("/login")}
              style={{ padding: "12px 20px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}
            >
              Go to Login
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ position: "relative", width: 44, height: 44 }}>
            <div style={{ position: "absolute", width: "100%", height: "100%", border: "2px solid rgba(59,130,246,0.1)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", width: "100%", height: "100%", border: "2px solid transparent", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
          <p style={{ color: "#64748B", fontSize: 13, letterSpacing: "2px", textTransform: "uppercase" }}>Initializing Workspace</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );

  const userName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Designer";
  const userInitial = userName[0].toUpperCase();
  const sidebarW = sidebarCollapsed ? 80 : 260;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#05070A", fontFamily: "system-ui, sans-serif", position: "relative", overflow: "hidden" }}>

      <div style={{ position: "absolute", top: "-200px", left: "-200px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-300px", right: "-100px", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />

      {/* SIDEBAR */}
      <aside className="no-print" style={{ width: sidebarW, flexShrink: 0, alignSelf: "stretch", minHeight: "100vh", background: "rgba(8,11,20,0.95)", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)", zIndex: 50 }}>
        <div style={{ padding: sidebarCollapsed ? "28px 0" : "28px 24px", display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "space-between", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
              <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 700, flexShrink: 0 }}>◈</div>
              <div style={{ whiteSpace: "nowrap", fontSize: 17, fontWeight: 700, color: "#fff" }}>InteriorIdeas<span style={{ color: "#3B82F6" }}>.ai</span></div>
            </div>
          )}
          {sidebarCollapsed && (
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 700 }}>◈</div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ position: sidebarCollapsed ? "static" : "absolute", right: "-12px", width: 24, height: 24, background: "#0F1423", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94A3B8", fontSize: 14, zIndex: 60, marginTop: sidebarCollapsed ? 20 : 0 }}>
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {!sidebarCollapsed && <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "1.5px", textTransform: "uppercase", padding: "0 12px", marginBottom: 8 }}>Workspace</div>}
          {NAV.map(({ id, label, icon }) => {
            const isActive = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} title={sidebarCollapsed ? label : undefined}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: sidebarCollapsed ? "12px 0" : "12px 16px", justifyContent: sidebarCollapsed ? "center" : "flex-start", background: isActive ? "rgba(59,130,246,0.1)" : "transparent", borderLeft: isActive ? "3px solid #3B82F6" : "3px solid transparent", borderRadius: sidebarCollapsed ? 12 : 0, cursor: "pointer", color: isActive ? "#fff" : "#64748B", border: "none", fontSize: 14, fontWeight: isActive ? 600 : 500, width: "100%", transition: "all 0.2s", textAlign: "left" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "#64748B"; }}>
                <span style={{ fontSize: 18, flexShrink: 0, color: isActive ? "#3B82F6" : "inherit" }}>{icon}</span>
                {!sidebarCollapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        <div ref={dropdownRef} style={{ padding: "20px 16px", borderTop: "1px solid rgba(255,255,255,0.03)", position: "relative" }}>
          <button onClick={() => setShowDropdown(!showDropdown)}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, cursor: "pointer", justifyContent: sidebarCollapsed ? "center" : "flex-start" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
            <div style={{ width: 34, height: 34, background: "#1E293B", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0, border: "1px solid #334155" }}>{userInitial}</div>
            {!sidebarCollapsed && (
              <div style={{ textAlign: "left", overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>Pro Studio</div>
              </div>
            )}
          </button>
          {showDropdown && (
            <div style={{ position: "absolute", bottom: "calc(100% + 12px)", left: 16, right: 16, background: "#0F1423", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{userName}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{user.email}</div>
              </div>
              <div style={{ padding: "8px" }}>
                <button onClick={handleLogout}
                  style={{ width: "100%", padding: "10px 12px", background: "transparent", border: "none", borderRadius: 8, color: "#EF4444", cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  ↩ Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 10 }}>

        <header className="no-print" style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", position: "sticky", top: 0, zIndex: 40, background: "rgba(5,7,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{NAV.find(n => n.id === activeTab)?.label}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              {activeTab === "design" ? "Design studio active" : activeTab === "history" ? `${history.length} saved layouts` : "Performance metrics"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {activeTab !== "design" && (
              <button onClick={() => setActiveTab("design")}
                style={{ padding: "10px 20px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ✦ Start Designing
              </button>
            )}
            <div style={{ fontSize: 12, color: "#64748B", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 16px" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>

          {/* ANALYTICS */}
          {activeTab === "stats" && (
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: "inline-block", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "4px 12px", fontSize: 10, color: "#3B82F6", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Intelligence</div>
                <h1 style={{ fontSize: 38, fontWeight: 800, color: "#fff", margin: 0 }}>Studio <span style={{ color: "#3B82F6" }}>Metrics</span></h1>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
                {[
                  { label: "Total renders", value: stats.total, icon: "🎨", color: "#3B82F6" },
                  { label: "This month", value: stats.thisMonth, icon: "📅", color: "#6366F1" },
                  { label: "Top canvas", value: stats.topRoom, icon: "🏠", color: "#06B6D4" },
                  { label: "Signature style", value: stats.topStyle, icon: "✨", color: "#F59E0B" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: `linear-gradient(90deg, ${color}, transparent)` }} />
                    <div style={{ fontSize: 22, marginBottom: 16 }}>{icon}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{value || "—"}</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{label}</div>
                  </div>
                ))}
              </div>
              {stats.roomCounts.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {[
                    { title: "Spaces Designed", data: stats.roomCounts, color: "#3B82F6" },
                    { title: "Aesthetics Applied", data: stats.styleCounts, color: "#6366F1" },
                  ].map(({ title, data, color }) => (
                    <div key={title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 32 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />{title}
                      </div>
                      {data.map(({ name, count }) => (
                        <div key={name} style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 14, color: "#94A3B8" }}>{name}</span>
                            <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{count}</span>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(count / stats.total) * 100}%`, background: color, borderRadius: 10 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "80px 40px", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>📊</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>No data yet</div>
                  <div style={{ fontSize: 15, color: "#475569", marginBottom: 30 }}>Generate and save designs to see analytics.</div>
                  <button onClick={() => setActiveTab("design")} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Enter Studio →</button>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {activeTab === "history" && (
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <div style={{ marginBottom: 36, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ display: "inline-block", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "4px 12px", fontSize: 10, color: "#3B82F6", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>Archives</div>
                  <h1 style={{ fontSize: 38, fontWeight: 800, color: "#fff", margin: 0 }}>Design <span style={{ color: "#3B82F6" }}>Gallery</span></h1>
                </div>
                <div style={{ fontSize: 13, color: "#475569" }}>{history.length} design{history.length !== 1 ? "s" : ""} saved</div>
              </div>
              <div style={{ position: "relative", marginBottom: 32 }}>
                <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "#475569" }}>🔍</span>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search your library..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 20px 16px 48px", color: "#fff", fontSize: 15, outline: "none" }}
                  onFocus={e => { e.target.style.borderColor = "#3B82F6"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }} />
              </div>
              {historyLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "40px", color: "#64748B", justifyContent: "center" }}>
                  <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Loading...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "80px 40px", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>{searchQuery ? "🔍" : "🖼️"}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{searchQuery ? "No results" : "Empty Gallery"}</div>
                  <div style={{ fontSize: 15, color: "#475569", marginBottom: 30 }}>{searchQuery ? `No designs match "${searchQuery}"` : "Create your first design to populate the gallery."}</div>
                  {!searchQuery && <button onClick={() => setActiveTab("design")} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Enter Studio →</button>}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {filteredHistory.map(design => (
                    <div key={design.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                          {[design.room, design.style].map(tag => (
                            <span key={tag} style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>{tag}</span>
                          ))}
                          <span style={{ fontSize: 12, color: "#475569", marginLeft: 6 }}>{new Date(design.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>{design.concept_title}</h3>
                        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: 0 }}>{design.concept_description?.slice(0, 150)}...</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, marginLeft: 20 }}>
                        <button onClick={() => handleLoadDesign(design)}
                          style={{ padding: "10px 24px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, color: "#60A5FA", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#3B82F6"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; e.currentTarget.style.color = "#60A5FA"; }}>
                          Open
                        </button>
                        <button onClick={() => handleDeleteDesign(design.id)}
                          style={{ padding: "10px 24px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 10, color: "#EF4444", cursor: "pointer", fontSize: 14 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DESIGN STUDIO */}
          {activeTab === "design" && (
            <div style={{ maxWidth: 940, margin: "0 auto" }}>
              {!result && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 20 }}>
                    <div style={{ width: 8, height: 8, background: "#3B82F6", borderRadius: "50%" }} />
                    <span style={{ fontSize: 10, color: "#60A5FA", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>AI generation ready</span>
                  </div>
                  <h1 style={{ fontSize: 48, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-1.5px" }}>
                    Setup your <span style={{ background: "linear-gradient(to right, #3B82F6, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>masterplan.</span>
                  </h1>
                </div>
              )}

              {/* Progress Steps */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 36, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "16px 32px" }}>
                {["Configuration", "Processing", "Masterpiece"].map((step, i) => (
                  <div key={step} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: i + 1 <= activeStep ? "#3B82F6" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: i + 1 <= activeStep ? "#fff" : "#475569", fontWeight: 700, flexShrink: 0, transition: "all 0.5s", boxShadow: i + 1 <= activeStep ? "0 0 15px rgba(59,130,246,0.5)" : "none" }}>
                        {i + 1 < activeStep ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: 13, color: i + 1 <= activeStep ? "#fff" : "#475569", fontWeight: i + 1 <= activeStep ? 600 : 500, transition: "color 0.5s" }}>{step}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 2, background: i + 1 < activeStep ? "#3B82F6" : "rgba(255,255,255,0.05)", margin: "0 20px", borderRadius: 2, transition: "background 0.5s" }} />}
                  </div>
                ))}
              </div>

              {/* FORM */}
              {!result && !loading && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 40 }}>
                  <div style={{ marginBottom: 36 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Select Canvas (Room)</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                      {ROOMS.map(r => {
                        const isSel = form.room === r;
                        return (
                          <button key={r} onClick={() => setForm({...form, room: r})}
                            style={{ padding: "20px 10px", background: isSel ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)", border: isSel ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)", borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transition: "all 0.2s" }}
                            onMouseEnter={e => { if(!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                            onMouseLeave={e => { if(!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                            <span style={{ fontSize: 26 }}>{ROOM_ICONS[r]}</span>
                            <span style={{ fontSize: 11, fontWeight: isSel ? 700 : 500, color: isSel ? "#fff" : "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 32 }}>
                    {[["style","Aesthetic",STYLES],["palette","Color Grade",PALETTES],["budget","Budget Tier",BUDGETS]].map(([key,label,opts]) => (
                      <div key={key}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 12 }}>{label}</label>
                        <select style={{ width: "100%", background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 20px", color: "#fff", fontSize: 15, cursor: "pointer", outline: "none" }}
                          value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} disabled={loading}
                          onFocus={e => { e.target.style.borderColor = "#3B82F6"; }}
                          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                          {opts.map(o => <option key={o} style={{ background: "#0D121F" }}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 36 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                      Specific Directives <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "#334155" }}>(optional)</span>
                    </label>
                    <textarea style={{ width: "100%", background: "#0D121F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 20px", color: "#fff", fontSize: 15, resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
                      placeholder="Special requirements, e.g. pet-friendly fabrics, lots of natural light..."
                      value={form.extra} onChange={e => setForm({...form,extra:e.target.value})} disabled={loading} rows={3}
                      onFocus={e => { e.target.style.borderColor = "#3B82F6"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }} />
                  </div>

                  {error && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "16px 24px", marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>⚠ Error</div>
                      <div style={{ fontSize: 13, color: "#EF4444" }}>{error}</div>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={loading}
                    style={{ width: "100%", padding: "18px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: "1px", boxShadow: "0 8px 30px rgba(59,130,246,0.4)" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                    INITIATE AI RENDER ✦
                  </button>
                </div>
              )}

              {/* LOADING */}
              {loading && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{ position: "relative", width: 80, height: 80, marginBottom: 30 }}>
                    <div style={{ position: "absolute", inset: 0, border: "3px solid rgba(255,255,255,0.05)", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", inset: 0, border: "3px solid transparent", borderTopColor: "#3B82F6", borderRightColor: "#6366F1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  </div>
                  <h2 style={{ fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 12 }}>Synthesizing Masterplan</h2>
                  <p style={{ fontSize: 15, color: "#64748B", maxWidth: 300, lineHeight: 1.5 }}>Analyzing {form.palette} palette for your {form.style} {form.room}...</p>
                </div>
              )}

              {/* RESULT */}
              {result && !loading && (
                <div>
                  {savedMsg && (
                    <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 16, padding: "16px 24px", marginBottom: 20, color: "#34D399", fontSize: 15, fontWeight: 700 }}>
                      ✓ Masterplan secured to your gallery.
                    </div>
                  )}

                  <div className="print-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, overflow: "hidden", marginBottom: 24 }}>
                    {/* Header */}
                    <div style={{ padding: "40px 48px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 30 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60A5FA" }} /> Render Complete
                          </div>
                          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0 }}>{result.concept_title}</h2>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {[form.room, form.style, form.budget].map(tag => (
                            <span key={tag} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12 }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "48px" }}>
                      <p style={{ fontSize: 16, color: "#94A3B8", lineHeight: 1.8, marginBottom: 40 }}>{result.concept_description}</p>

                      {/* INSPIRATION PHOTOS WITH OVERLAYS */}
                      {photos.length > 0 && (
                        <div style={{ marginBottom: 40 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 4, height: 16, background: "#F59E0B", borderRadius: 4 }} /> Inspiration Photos
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {photos.map((p, i) => {
                              const piece = result.furniture?.[i];
                              return (
                                <div key={i} style={{ borderRadius: 12, overflow: "hidden", position: "relative", aspectRatio: "16/9" }}>
                                  <img
                                    src={p.url}
                                    alt={`Inspiration ${i + 1}`}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={e => { e.target.style.display = "none"; }}
                                  />

                                  {/* DIMENSIONS — top left */}
                                  {piece && (piece.width_cm || piece.height_cm || piece.depth_cm) && (
                                    <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
                                      {[["W", piece.width_cm], ["H", piece.height_cm], ["D", piece.depth_cm]].map(([label, val]) =>
                                        val ? (
                                          <span key={label} style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#67E8F9", letterSpacing: "0.5px" }}>
                                            {label}: {val}cm
                                          </span>
                                        ) : null
                                      )}
                                    </div>
                                  )}

                                  {/* FURNITURE NAME — top right */}
                                  {piece && (
                                    <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#fff", maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {piece.item}
                                    </div>
                                  )}

                                  {/* PRICE — bottom left above credit */}
                                  {piece && (
                                    <div style={{ position: "absolute", bottom: 32, left: 10, background: "rgba(6,182,212,0.88)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                                      {piece.approx_price}
                                    </div>
                                  )}

                                  {/* CREDIT — bottom */}
                                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                                    Photo by <a href={p.creditLink} target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.9)" }}>{p.credit}</a> on Unsplash
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ROOM DIMENSIONS */}
                      {result.room_dimensions && (
                        <div style={{ marginBottom: 40 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 4, height: 16, background: "#06B6D4", borderRadius: 4 }} /> Recommended Room Dimensions
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                            {[
                              { label: "Width", value: `${result.room_dimensions.recommended_width_m}m`, icon: "↔️" },
                              { label: "Length", value: `${result.room_dimensions.recommended_length_m}m`, icon: "↕️" },
                              { label: "Ceiling Height", value: `${result.room_dimensions.ceiling_height_m}m`, icon: "⬆️" },
                            ].map(({ label, value, icon }) => (
                              <div key={label} style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                                <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: "#67E8F9", marginBottom: 6 }}>{value}</div>
                                <div style={{ fontSize: 12, color: "#475569", letterSpacing: "0.5px" }}>{label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* BUDGET TRACKER */}
                      {result.furniture && (() => {
                        const totalSpend = result.furniture.reduce((sum, f) => {
                          const num = parseFloat((f.approx_price || "0").replace(/[^0-9.]/g, ""));
                          return sum + (isNaN(num) ? 0 : num);
                        }, 0);
                        const budgetMap = { "$500 – $1,500": [500,1500], "$1,500 – $5,000": [1500,5000], "$5,000 – $15,000": [5000,15000], "$15,000+": [15000,20000] };
                        const [budgetMin, budgetMax] = budgetMap[form.budget] || [1500,5000];
                        const pct = Math.min((totalSpend / budgetMax) * 100, 100);
                        const isOver = totalSpend > budgetMax;
                        const isClose = !isOver && totalSpend > budgetMax * 0.85;
                        const barColor = isOver ? "#EF4444" : isClose ? "#F59E0B" : "#10B981";
                        const remaining = budgetMax - totalSpend;
                        return (
                          <div style={{ marginBottom: 40 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 4, height: 16, background: barColor, borderRadius: 4 }} /> Budget Tracker
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isOver ? "rgba(239,68,68,0.2)" : isClose ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`, borderRadius: 16, padding: "24px 28px" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: 11, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Totali</div>
                                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>${totalSpend.toLocaleString()}</div>
                                </div>
                                <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                                  <div style={{ fontSize: 11, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Budget</div>
                                  <div style={{ fontSize: 18, fontWeight: 800, color: "#94A3B8", marginTop: 4 }}>{form.budget}</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: 11, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>{isOver ? "Tejkaluar" : "Mbetur"}</div>
                                  <div style={{ fontSize: 28, fontWeight: 800, color: barColor }}>{isOver ? `+$${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()}`}</div>
                                </div>
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 10 }} />
                                </div>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, color: "#475569" }}>${budgetMin.toLocaleString()}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
                                  {isOver ? `⚠ ${pct.toFixed(0)}% — Tejkaluar` : isClose ? `⚡ ${pct.toFixed(0)}% — Afër limitit` : `✓ ${pct.toFixed(0)}% — Brenda budget-it`}
                                </span>
                                <span style={{ fontSize: 12, color: "#475569" }}>${budgetMax.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 }}>
                        {/* Core Elements */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 4, height: 16, background: "#3B82F6", borderRadius: 4 }} /> Core Elements
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {result.key_elements?.map((el, i) => (
                              <span key={i} style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "8px 16px", fontSize: 14, color: "#93C5FD" }}>{el}</span>
                            ))}
                          </div>
                        </div>

                        {/* Palette */}
                        {result.color_tips && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 4, height: 16, background: "#8B5CF6", borderRadius: 4 }} /> Palette Integration
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                              {result.color_tips.map((tip, i) => (
                                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                  <span style={{ color: "#8B5CF6", fontSize: 18, lineHeight: 1 }}>◈</span>
                                  <span style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6 }}>{tip}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* FURNITURE WITH DIMENSIONS */}
                      <div style={{ marginBottom: 44 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 4, height: 16, background: "#06B6D4", borderRadius: 4 }} /> Curated Pieces
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {result.furniture?.map((f, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 24px", transition: "background 0.3s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: (f.width_cm || f.height_cm || f.depth_cm) ? 12 : 0 }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>{f.item}</div>
                                  <div style={{ fontSize: 14, color: "#475569" }}>{f.description}</div>
                                </div>
                                <div style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 10, padding: "8px 18px", color: "#67E8F9", fontWeight: 800, fontSize: 15, marginLeft: 20, whiteSpace: "nowrap" }}>{f.approx_price}</div>
                              </div>
                              {(f.width_cm || f.height_cm || f.depth_cm) && (
                                <div style={{ display: "flex", gap: 8 }}>
                                  {[["W", f.width_cm], ["H", f.height_cm], ["D", f.depth_cm]].map(([label, val]) => val ? (
                                    <span key={label} style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#60A5FA" }}>
                                      {label}: {val}cm
                                    </span>
                                  ) : null)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Tip */}
                      {result.pro_tip && (
                        <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "32px 36px", position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "linear-gradient(to bottom, #3B82F6, #6366F1)" }} />
                          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2px", color: "#60A5FA", marginBottom: 12, textTransform: "uppercase" }}>Director&apos;s Insight</div>
                          <p style={{ fontSize: 16, color: "#E2E8F0", fontStyle: "italic", lineHeight: 1.8, margin: 0 }}>&ldquo;{result.pro_tip}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="no-print" style={{ display: "flex", gap: 16 }}>
                    <button onClick={() => { setResult(null); setActiveStep(1); setPhotos([]); }}
                      style={{ flex: 1, padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
                      ← Reset Studio
                    </button>
                    <button onClick={handlePrint}
                      style={{ padding: "18px 24px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 16, color: "#818CF8", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                      🖨️ PDF
                    </button>
                    <button onClick={handleSave} disabled={saving || savedMsg}
                      style={{ flex: 1, padding: "18px", background: savedMsg ? "rgba(16,185,129,0.1)" : "linear-gradient(135deg, #3B82F6, #6366F1)", border: savedMsg ? "1px solid rgba(16,185,129,0.3)" : "none", borderRadius: 16, color: savedMsg ? "#34D399" : "#fff", fontSize: 15, fontWeight: 800, cursor: saving || savedMsg ? "not-allowed" : "pointer", boxShadow: savedMsg || saving ? "none" : "0 8px 30px rgba(59,130,246,0.4)" }}
                      onMouseEnter={e => { if (!saving && !savedMsg) e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                      {savedMsg ? "✓ SECURED" : saving ? "SAVING..." : "COMMIT DESIGN ✓"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          .no-print { display: none !important; }
          .print-card { background: white !important; color: #111 !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
}
