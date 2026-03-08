"use client";

import { useState } from "react";

const SYSTEM_PROMPT = `Je ArchiMind, një dizajner i brendshëm ekspert me 15 vjet përvojë.
Ti ndihmon njerëzit të transformojnë hapësirat e tyre me ide profesionale dhe praktike.

ROLI YT:
- Je ekspert në stile si: Minimalist, Scandinavian, Industrial, Bohemian, Mediterranean, Modern Luxury
- Kupton buxhetet dhe sugjeron zgjidhje realiste
- Flet si një mik ekspert, jo si një robot

RREGULLAT:
- DUHET të japësh sugjerime konkrete (emra mobiljesh, ngjyra specifike, dimensione)
- DUHET të përfshish çmime approximate reale
- NUK DUHET të japësh ide abstrakte pa shembuj praktikë
- NUK DUHET të tejkalosh buxhetin e dhënë
- Gjithmonë konsidero hapësirën dhe funksionalitetin

FORMATI I OUTPUT:
- Kthe VETËM JSON të pastër, pa markdown, pa backticks
- Struktura duhet të jetë e qëndrueshme dhe e parseable
- Çmimet në USD

AUDIENCA: Individë që rinovojnë shtëpinë, familje të reja, dizajnerë fillestarë`;

const INTERACTIONS = {
  design: {
    label: "🎨 Gjenero Dizajn",
    description: "Ide të plota për dhomën tënde",
    temperature: 0.8,
    buildPrompt: ({ room, style, palette, budget }) => `
Krijo një plan dizajni të plotë për:
- Dhoma: ${room}
- Stili: ${style}
- Paleta: ${palette}
- Buxheti: ${budget}

Kthe VETËM këtë JSON:
{
  "concept_title": "Titull kreativ",
  "concept_description": "2-3 fjali për vizionin",
  "key_elements": ["elementi 1", "elementi 2", "elementi 3", "elementi 4"],
  "furniture": [
    {"item": "Emri", "description": "Përshkrim", "approx_price": "$XXX"}
  ],
  "color_tips": ["këshillë 1", "këshillë 2", "këshillë 3"],
  "pro_tip": "Një tip eksperti unik"
}`,
  },
  budget: {
    label: "💰 Analizo Buxhetin",
    description: "Planifikim i detajuar financiar",
    temperature: 0.2,
    buildPrompt: ({ room, style, budget }) => `
Bëj një analizë të detajuar buxheti për:
- Dhoma: ${room}
- Stili: ${style}
- Buxheti total: ${budget}

Kthe VETËM këtë JSON:
{
  "total_budget": "$X,XXX",
  "breakdown": [
    {"category": "Kategoria", "percentage": 30, "amount": "$XXX", "items": ["item 1", "item 2"]},
    {"category": "Kategoria", "percentage": 25, "amount": "$XXX", "items": ["item 1", "item 2"]},
    {"category": "Kategoria", "percentage": 20, "amount": "$XXX", "items": ["item 1", "item 2"]},
    {"category": "Kategoria", "percentage": 15, "amount": "$XXX", "items": ["item 1"]},
    {"category": "Rezervë", "percentage": 10, "amount": "$XXX", "items": ["emergjenca"]}
  ],
  "saving_tips": ["tip 1", "tip 2", "tip 3"],
  "priority_items": ["gjëja 1 për të blerë", "gjëja 2", "gjëja 3"]
}`,
  },
  creative: {
    label: "✨ Ide Kreative",
    description: "Sugjerime të pazakonta dhe unike",
    temperature: 1.0,
    buildPrompt: ({ room, style }) => `
Bëj brainstorming kreativ dhe të guximshëm për:
- Dhoma: ${room}
- Stili: ${style}

Kthe VETËM këtë JSON:
{
  "unexpected_ideas": [
    {"idea": "Ideja e guximshme", "why_it_works": "Pse funksionon", "difficulty": "easy/medium/hard"},
    {"idea": "Ideja e guximshme", "why_it_works": "Pse funksionon", "difficulty": "easy/medium/hard"},
    {"idea": "Ideja e guximshme", "why_it_works": "Pse funksionon", "difficulty": "easy/medium/hard"}
  ],
  "diy_project": {"name": "Projekt DIY", "materials": ["materiali 1", "materiali 2"], "estimated_cost": "$XX", "steps": ["hapi 1", "hapi 2", "hapi 3"]},
  "trending_now": "Çfarë është trendy tani në këtë stil",
  "wildcard": "Një ide krejt e çmendur por interesante"
}`,
  },
};

const ROOMS = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Home Office", "Dining Room"];
const STYLES = ["Minimalist", "Scandinavian", "Industrial", "Bohemian", "Mediterranean", "Modern Luxury"];
const PALETTES = ["Earth Tones", "Nordic Frost", "Terracotta", "Sage & Linen", "Monochrome", "Jewel Tones"];
const BUDGETS = ["$500 - $1,500", "$1,500 - $5,000", "$5,000 - $15,000", "$15,000+"];

export default function InteriorIdeasV2() {
  const [form, setForm] = useState({ room: "Living Room", style: "Minimalist", palette: "Earth Tones", budget: "$1,500 - $5,000" });
  const [activeInteraction, setActiveInteraction] = useState("design");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  const currentInteraction = INTERACTIONS[activeInteraction];

  const callAI = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const userPrompt = currentInteraction.buildPrompt(form);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((i) => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (err) {
      setError("❌ Gabim: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = {
    app: { minHeight: "100vh", background: "#0A0A0F", color: "#E0D9FF", fontFamily: "system-ui, sans-serif", padding: "0 0 60px" },
    header: { background: "rgba(15,10,30,0.95)", borderBottom: "1px solid rgba(120,80,255,0.2)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
    logo: { fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #7B4FFF, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    main: { maxWidth: 800, margin: "0 auto", padding: "32px 20px" },
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "24px", marginBottom: 20 },
    label: { fontSize: 11, letterSpacing: "0.15em", color: "#7B4FFF", marginBottom: 8, display: "block", textTransform: "uppercase", fontWeight: 700 },
    select: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(120,80,255,0.3)", borderRadius: 8, padding: "10px 14px", color: "#E0D9FF", fontSize: 14, cursor: "pointer" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    interactionBtn: (active) => ({
      flex: 1, padding: "14px 12px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
      background: active ? "rgba(123,79,255,0.2)" : "rgba(255,255,255,0.04)",
      border: active ? "1.5px solid #7B4FFF" : "1px solid rgba(255,255,255,0.08)",
      color: active ? "#C084FC" : "#6B6B8A", textAlign: "left",
    }),
    generateBtn: { width: "100%", padding: "15px", background: "linear-gradient(135deg, #7B4FFF, #C084FC)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em" },
    tempBadge: (color) => ({ display: "inline-block", background: `${color}22`, border: `1px solid ${color}55`, color: color, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }),
    codeBlock: { background: "#0D0D1A", border: "1px solid rgba(123,79,255,0.2)", borderRadius: 8, padding: "16px", fontSize: 12, fontFamily: "monospace", color: "#A0FF9B", overflow: "auto", whiteSpace: "pre-wrap" },
    resultSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 11, letterSpacing: "0.2em", color: "#7B4FFF", textTransform: "uppercase", marginBottom: 12, fontWeight: 700 },
    chip: { display: "inline-block", background: "rgba(123,79,255,0.15)", border: "1px solid rgba(123,79,255,0.3)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#C084FC", margin: "3px" },
    itemRow: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  };

  const tempColors = { design: "#F59E0B", budget: "#10B981", creative: "#EF4444" };
  const tempValues = { design: "0.8 — Kreativ", budget: "0.2 — Preciz", creative: "1.0 — Çmendur" };

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.logo}>◈ InteriorIdeas.ai</div>
        <span style={{ fontSize: 11, color: "#4B4B6A", letterSpacing: "0.1em" }}>JAVA 2 — SYSTEM PROMPTS</span>
      </header>

      <main style={s.main}>
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ ...s.label, marginBottom: 0 }}>🧬 System Prompt — DNA e AI-së</span>
            <button onClick={() => setShowPrompt(!showPrompt)} style={{ background: "none", border: "1px solid rgba(123,79,255,0.3)", color: "#7B4FFF", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>
              {showPrompt ? "Fshih" : "Shiko"}
            </button>
          </div>
          <p style={{ fontSize: 13, color: "#6B6B8A", margin: "0 0 8px" }}>Ky system prompt i jep AI-së rolin, rregullat, formatin dhe audiencën.</p>
          {showPrompt && <div style={s.codeBlock}>{SYSTEM_PROMPT}</div>}
        </div>

        <div style={s.card}>
          <span style={s.label}>⚙ Preferencat e tua</span>
          <div style={s.grid2}>
            {[["room", "Dhoma", ROOMS], ["style", "Stili", STYLES], ["palette", "Paleta", PALETTES], ["budget", "Buxheti", BUDGETS]].map(([key, lbl, opts]) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: "#6B6B8A", display: "block", marginBottom: 6 }}>{lbl}</label>
                <select style={s.select} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <span style={s.label}>🔀 3 Interaksionet e Ndryshme</span>
          <p style={{ fontSize: 13, color: "#6B6B8A", margin: "0 0 16px" }}>Çdo interaksion ka temperature të ndryshme sepse ka qëllim të ndryshëm.</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            {Object.entries(INTERACTIONS).map(([key, val]) => (
              <button key={key} onClick={() => { setActiveInteraction(key); setResult(null); }} style={s.interactionBtn(activeInteraction === key)}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{val.label}</div>
                <div style={{ fontSize: 11, marginBottom: 8 }}>{val.description}</div>
                <span style={s.tempBadge(tempColors[key])}>temp: {val.temperature}</span>
              </button>
            ))}
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "12px 16px", marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#6B6B8A", marginBottom: 6 }}>📊 TEMPERATURE PËR KËTË INTERAKSION:</div>
            <div style={{ fontSize: 14, color: tempColors[activeInteraction], fontWeight: 700 }}>{tempValues[activeInteraction]}</div>
            <div style={{ fontSize: 12, color: "#5B5B7A", marginTop: 4 }}>
              {activeInteraction === "budget" && "Buxheti kërkon saktësi → temperature e ulët = të njëjtat rezultate çdo herë"}
              {activeInteraction === "design" && "Dizajni kërkon kreativitet → temperature mesatare = ide të reja por konsistente"}
              {activeInteraction === "creative" && "Brainstorming kërkon çmenduri → temperature e lartë = surpriza të vërteta"}
            </div>
          </div>
        </div>

        <button onClick={callAI} disabled={loading} style={{ ...s.generateBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "⏳ Duke gjeneruar..." : `${currentInteraction.label} — Gjenero`}
        </button>

        {error && <div style={{ color: "#EF4444", padding: "12px", background: "rgba(239,68,68,0.1)", borderRadius: 8, marginTop: 16, fontSize: 13 }}>{error}</div>}

        {result && (
          <div style={{ ...s.card, marginTop: 20 }}>
            <span style={s.label}>✅ Rezultati nga AI</span>

            {activeInteraction === "design" && (
              <>
                <h2 style={{ fontSize: 22, margin: "0 0 8px", color: "#E0D9FF" }}>{result.concept_title}</h2>
                <p style={{ color: "#8B8BAA", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{result.concept_description}</p>
                <div style={s.resultSection}>
                  <div style={s.sectionTitle}>Elementet kyçe</div>
                  <div>{result.key_elements?.map((el, i) => <span key={i} style={s.chip}>{el}</span>)}</div>
                </div>
                <div style={s.resultSection}>
                  <div style={s.sectionTitle}>Mobilje të rekomanduara</div>
                  {result.furniture?.map((f, i) => (
                    <div key={i} style={s.itemRow}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{f.item}</div>
                        <div style={{ fontSize: 12, color: "#6B6B8A" }}>{f.description}</div>
                      </div>
                      <span style={{ color: "#C084FC", fontWeight: 700, fontSize: 14 }}>{f.approx_price}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(123,79,255,0.08)", border: "1px solid rgba(123,79,255,0.2)", borderRadius: 8, padding: "14px", marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: "#7B4FFF", letterSpacing: "0.2em", marginBottom: 6 }}>✦ PRO TIP</div>
                  <p style={{ fontSize: 13, color: "#A0A0C0", fontStyle: "italic", margin: 0 }}>"{result.pro_tip}"</p>
                </div>
              </>
            )}

            {activeInteraction === "budget" && (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981", marginBottom: 20 }}>{result.total_budget}</div>
                <div style={s.resultSection}>
                  <div style={s.sectionTitle}>Ndarja e buxhetit</div>
                  {result.breakdown?.map((b, i) => (
                    <div key={i} style={s.itemRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.category}</div>
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                          <div style={{ width: `${b.percentage}%`, height: "100%", background: "#10B981", borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#6B6B8A", marginTop: 4 }}>{b.items?.join(", ")}</div>
                      </div>
                      <div style={{ textAlign: "right", marginLeft: 16 }}>
                        <div style={{ color: "#10B981", fontWeight: 700 }}>{b.amount}</div>
                        <div style={{ fontSize: 11, color: "#6B6B8A" }}>{b.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={s.resultSection}>
                  <div style={s.sectionTitle}>Tips për kursim</div>
                  {result.saving_tips?.map((t, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13, color: "#8B8BAA" }}>💡 {t}</div>
                  ))}
                </div>
              </>
            )}

            {activeInteraction === "creative" && (
              <>
                <div style={s.resultSection}>
                  <div style={s.sectionTitle}>Ide të pazakonta 🔥</div>
                  {result.unexpected_ideas?.map((idea, i) => (
                    <div key={i} style={{ ...s.itemRow, flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{idea.idea}</div>
                        <span style={{ fontSize: 11, background: idea.difficulty === "easy" ? "#10B98122" : idea.difficulty === "medium" ? "#F59E0B22" : "#EF444422", color: idea.difficulty === "easy" ? "#10B981" : idea.difficulty === "medium" ? "#F59E0B" : "#EF4444", padding: "2px 8px", borderRadius: 6 }}>{idea.difficulty}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6B6B8A" }}>{idea.why_it_works}</div>
                    </div>
                  ))}
                </div>
                {result.diy_project && (
                  <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#EF4444", letterSpacing: "0.15em", marginBottom: 8 }}>🛠 PROJEKT DIY — {result.diy_project.name}</div>
                    <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>Kosto: {result.diy_project.estimated_cost}</div>
                    {result.diy_project.steps?.map((step, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#8B8BAA", padding: "4px 0" }}>→ {step}</div>
                    ))}
                  </div>
                )}
                {result.wildcard && (
                  <div style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 10, color: "#C084FC", letterSpacing: "0.2em", marginBottom: 6 }}>🃏 WILDCARD IDEA</div>
                    <p style={{ fontSize: 13, color: "#C084FC", fontStyle: "italic", margin: 0 }}>{result.wildcard}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}