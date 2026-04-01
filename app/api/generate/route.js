export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();

    // --- AI Generation ---
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are an expert interior designer. Return ONLY valid JSON — no markdown, no backticks, no explanation. Just the raw JSON object.",
          },
          {
            role: "user",
            content: `Create a design for: Room: ${room}, Style: ${style}, Palette: ${palette}, Budget: ${budget}. ${extra || ""}
Return exactly this JSON structure:
{
  "concept_title": "...",
  "concept_description": "...",
  "key_elements": ["...", "..."],
  "furniture": [
    {"item": "...", "description": "...", "approx_price": "$XXX", "width_cm": 120, "height_cm": 80, "depth_cm": 60}
  ],
  "color_tips": ["...", "..."],
  "pro_tip": "...",
  "room_dimensions": {
    "recommended_width_m": 4.5,
    "recommended_length_m": 6.0,
    "ceiling_height_m": 2.7
  },
  "layout_tips": ["placement tip 1", "placement tip 2"]
}`,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errText);
      return Response.json(
        { success: false, error: `Groq API failed: ${groqRes.status}` },
        { status: 500 }
      );
    }

    const groqData = await groqRes.json();
    const rawText = groqData.choices?.[0]?.message?.content || "";

    // Strip any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let design;
    try {
      design = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text was:", rawText);
      return Response.json(
        { success: false, error: "AI returned invalid JSON. Please try again." },
        { status: 500 }
      );
    }

    // --- Unsplash Photos ---
    let photos = [];
    try {
      const query = encodeURIComponent(`${style} ${room} interior design`);
      const unsplashRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=4&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!unsplashRes.ok) {
        console.warn("Unsplash failed:", unsplashRes.status);
      } else {
        const unsplashData = await unsplashRes.json();
        photos = (unsplashData.results || []).map((p) => ({
          url: p.urls.regular,
          thumb: p.urls.small,
          credit: p.user.name,
          creditLink: p.user.links.html,
        }));
      }
    } catch (photoErr) {
      console.warn("Unsplash exception:", photoErr.message);
      // Non-fatal — continue without photos
    }

    return Response.json({ success: true, design, photos });

  } catch (error) {
    console.error("Unhandled error in /api/generate:", error);
    return Response.json(
      { success: false, error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}