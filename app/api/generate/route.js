import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { room, style, palette, budget, extra } = await req.json();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: "Je ArchiMind, dizajner ekspert. Kthe VETËM JSON të pastër, pa markdown, pa backticks.",
      messages: [{ role: "user", content: `Krijo dizajn për: Dhoma: ${room}, Stili: ${style}, Paleta: ${palette}, Buxheti: ${budget}. ${extra || ""} Kthe: {"concept_title":"...","concept_description":"...","key_elements":["..."],"furniture":[{"item":"...","description":"...","approx_price":"$XXX"}],"color_tips":["..."],"pro_tip":"..."}` }],
    });

    const design = JSON.parse(message.content[0].text.replace(/```json|```/g,"").trim());
    return Response.json({ success: true, design });

  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Gjenerimi dështoi." }, { status: 500 });
  }
}