export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();
    
    // Kontrollon të dy emrat e variablave që i kemi në Vercel dhe Local
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("API Key is missing!");
      return Response.json({ success: false, error: "Konfigurimi i serverit dështoi." }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Model i shpejtë dhe stabil për studentë
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
    
    if (!data.choices || !data.choices[0]) {
      throw new Error(data.error?.message || "AI nuk ktheu përgjigje.");
    }

    const text = data.choices[0].message.content;
    
    // Pastron JSON-in nga mbetjet e mundshme të Markdown
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const design = JSON.parse(cleanJson);

    return Response.json({ success: true, design });

  } catch (error) {
    console.error("GENERATE_ERROR:", error.message);
    return Response.json({ success: false, error: "Gjenerimi dështoi. Provoni përsëri." }, { status: 500 });
  }
}