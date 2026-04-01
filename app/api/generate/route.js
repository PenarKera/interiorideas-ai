export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();

    // AI Generation
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: "You are an expert interior designer for InteriorIdeas.ai. Return ONLY clean JSON, no markdown, no backticks."
          },
          {
            role: "user",
            content: `Create a design for: Room: ${room}, Style: ${style}, Palette: ${palette}, Budget: ${budget}. ${extra || ""} 
Return this exact JSON structure:
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
}`
          }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const design = JSON.parse(text.replace(/```json|```/g, "").trim());

    // Unsplash photo search
    let photos = [];
    try {
      const query = encodeURIComponent(`${style} ${room} interior design`);
      const unsplashRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=4&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
      );
      const unsplashData = await unsplashRes.json();
      photos = unsplashData.results?.map(p => ({
        url: p.urls.regular,
        thumb: p.urls.small,
        credit: p.user.name,
        creditLink: p.user.links.html,
      })) || [];
    } catch (photoError) {
      console.error("Unsplash error:", photoError);
      // Continue without photos if Unsplash fails
    }

    return Response.json({ success: true, design, photos });

  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Generation failed. Please try again." }, { status: 500 });
  }
}