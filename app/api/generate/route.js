export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();
    
    // Përdorim variablën që pamë në Vercel Dashboard
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      console.error("GABIM: API Key mungon!");
      return Response.json({ success: false, error: "Konfigurimi i serverit dështoi." }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // NDRYSHIMI KËTU: Përdor këtë emër modeli sepse tjetri është mbyllur
        model: "llama-3.3-70b-versatile", 
        messages: [
          { 
            role: "system", 
            content: "You are an expert interior designer for InteriorIdeas.ai. Return ONLY clean JSON, no markdown, no backticks." 
          },
          { 
            role: "user", 
            content: `Create a design for: Room: ${room}, Style: ${style}, Palette: ${palette}, Budget: ${budget}. ${extra || ""} 
            Return JSON: {"concept_title":"...","concept_description":"...","key_elements":["..."],"furniture":[{"item":"...","description":"...","approx_price":"$XXX"}],"color_tips":["..."],"pro_tip":"..."}` 
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    // Kontrolli i sigurisë: Nëse Groq kthen error, mos e lejo kodin të "vdesë" te choices[0]
    if (!data.choices || !data.choices[0]) {
      console.error("Groq Error Response:", data);
      return Response.json({ success: false, error: data.error?.message || "AI dështoi." }, { status: 500 });
    }

    const text = data.choices[0].message.content;
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const design = JSON.parse(cleanJson);

    return Response.json({ success: true, design });

  } catch (error) {
    console.error("GENERATE_ERROR:", error.message);
    return Response.json({ success: false, error: "Gjenerimi dështoi. Provoni përsëri." }, { status: 500 });
  }
}