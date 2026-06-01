export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();
    const groqApiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!groqApiKey) {
      return Response.json(
        { success: false, error: "Groq API key is missing." },
        { status: 500 }
      );
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are an expert interior designer. Return ONLY valid JSON. No conversational text, no markdown fences, no explanations.",
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
              "room_dimensions": { "recommended_width_m": 4.5, "recommended_length_m": 6.0, "ceiling_height_m": 2.7 },
              "layout_tips": ["tip 1", "tip 2"]
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
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let design;
    try {
      design = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text was:", rawText);
      return Response.json(
        { success: false, error: "AI returned an invalid format. Try again." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, design, photos: [] });
  } catch (error) {
    console.error("Unhandled error:", error);
    return Response.json(
      { success: false, error: "An unexpected error happened." },
      { status: 500 }
    );
  }
}
