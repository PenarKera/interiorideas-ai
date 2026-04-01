import Groq from "groq-sdk";

export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();

    // Kontrollojmë të dy emrat e mundshëm të variablave (Vercel vs Local)
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GABIM: Groq API Key nuk u gjet në Environment Variables!");
      return Response.json(
        { success: false, error: "Konfigurimi i serverit dështoi (API Key mungon)." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const prompt = `Si një dizajner profesionist i brendshëm, krijo një plan për:
      Hapësira: ${room}
      Stili: ${style}
      Paleta e ngjyrave: ${palette}
      Buxheti: ${budget}
      Kërkesa shtesë: ${extra || "Asnjë"}

      Ktheje PËRGJIGJEN VETËM SI JSON (pa tekst tjetër, pa markdown) me këtë strukturë:
      {
        "concept_title": "Emri i konceptit",
        "concept_description": "Përshkrimi",
        "key_elements": ["element1", "element2"],
        "furniture": [{"item": "emri", "description": "pse duhet", "approx_price": "$XXX"}],
        "color_tips": ["këshilla"],
        "pro_tip": "një këshillë profesionale"
      }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a professional interior designer. You must return only valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error("AI nuk ktheu asnjë përgjigje.");
    }

    // Pastrojmë përgjigjen nëse AI shton gabimisht ```json ... ```
    const cleanJson = rawContent.replace(/```json|```/g, "").trim();
    const design = JSON.parse(cleanJson);

    return Response.json({ success: true, design });

  } catch (error) {
    console.error("SERVER_ERROR_LOG:", error);
    return Response.json(
      { 
        success: false, 
        error: "Gjenerimi dështoi: " + (error.message || "Provoni përsëri.") 
      },
      { status: 500 }
    );
  }
}