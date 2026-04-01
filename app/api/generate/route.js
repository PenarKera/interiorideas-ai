export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: "You are an expert interior designer for InteriorIdeas.ai. Return ONLY clean JSON, no markdown, no backticks."
          },
          {
            role: "user",
            content: `Create a design for: Room: ${room}, Style: ${style}, Palette: ${palette}, Budget: ${budget}. ${extra || ""} Return: {"concept_title":"...","concept_description":"...","key_elements":["..."],"furniture":[{"item":"...","description":"...","approx_price":"$XXX"}],"color_tips":["..."],"pro_tip":"..."}`
          }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const design = JSON.parse(text.replace(/```json|```/g,"").trim());
    return Response.json({ success: true, design });

  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Generation failed. Please try again." }, { status: 500 });
  }
}
