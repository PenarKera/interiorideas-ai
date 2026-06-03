import { InferenceClient } from "@huggingface/inference";

export const runtime = "nodejs";
export const maxDuration = 60;

function getImageFromGeminiResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    const inlineData = part.inlineData || part.inline_data;
    const mimeType = inlineData?.mimeType || inlineData?.mime_type || "image/png";
    const imageData = inlineData?.data;

    if (imageData) {
      return `data:${mimeType};base64,${imageData}`;
    }
  }

  return "";
}

function getGeminiErrorMessage(errorText) {
  try {
    const parsed = JSON.parse(errorText);
    return parsed?.error?.message || errorText;
  } catch {
    return errorText;
  }
}

function getClientErrorMessage(status, geminiError) {
  if (status === 429) {
    return "Gemini quota u tejkalua per modelin e fotos. Kontrollo billing/rate limits ose provo me nje API key/model tjeter.";
  }

  if (status === 400 && /model|not found|unsupported/i.test(geminiError)) {
    return "Modeli i Gemini per foto nuk eshte i disponueshem per kete API key. Kontrollo GEMINI_IMAGE_MODEL.";
  }

  if (status === 401 || status === 403) {
    return "Gemini API key nuk ka akses. Kontrollo API key dhe lejet/billing.";
  }

  return `Gemini failed (${status}): ${geminiError}`;
}

function getCleanProviderError(error) {
  const rawMessage = error?.message || "Image generation failed.";

  if (/negative dimension|Fireworks|Workflow encountered/i.test(rawMessage)) {
    return "Pollinations/FLUX nuk e pranoi prompt-in. Provo nje prompt me te shkurter ose model tjeter.";
  }

  if (/quota|rate|limit/i.test(rawMessage)) {
    return "Pollinations rate limit u arrit. Provo perseri pas pak.";
  }

  return rawMessage.length > 220
    ? `${rawMessage.slice(0, 220)}...`
    : rawMessage;
}

function buildPollinationsPrompt({ room, style, palette, prompt }) {
  const shortPrompt = [
    "Photorealistic interior design render.",
    room ? `${room}.` : "",
    style ? `${style} style.` : "",
    palette ? `${palette} palette.` : "",
    prompt ? `User request: ${prompt}.` : "",
    "Keep realistic furniture, lighting, walls, windows, and proportions. No text, watermark, logo, or distorted geometry.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return shortPrompt.slice(0, 900);
}

async function generateWithHuggingFace({ imageBuffer, imageType, prompt }) {
  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;

  if (!hfToken) {
    return null;
  }

  const client = new InferenceClient(hfToken);
  const model = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-Kontext-dev";
  const strength = Number(process.env.HF_IMAGE_STRENGTH || 0.35);
  const imageBlob = await client.imageToImage({
    model,
    inputs: new Blob([imageBuffer], { type: imageType }),
    parameters: {
      prompt,
      negative_prompt: "text, watermark, logo, distorted furniture, unrealistic geometry",
      num_inference_steps: 28,
      guidance_scale: 7,
      image_guidance_scale: 1.8,
      strength,
    },
  });

  const outputBuffer = Buffer.from(await imageBlob.arrayBuffer());
  const outputType = imageBlob.type || "image/png";

  return `data:${outputType};base64,${outputBuffer.toString("base64")}`;
}

async function generateWithPollinations({ prompt }) {
  const apiKey = process.env.POLLINATIONS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.POLLINATIONS_IMAGE_MODEL || "flux";
  const params = new URLSearchParams({
    model,
    width: "1024",
    height: "1024",
    enhance: "false",
    key: apiKey,
  });
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pollinations failed (${response.status}): ${errorText}`);
  }

  const outputType = response.headers.get("content-type") || "image/jpeg";
  const outputBuffer = Buffer.from(await response.arrayBuffer());

  return `data:${outputType};base64,${outputBuffer.toString("base64")}`;
}

export async function POST(req) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;

    const formData = await req.formData();
    const image = formData.get("image");
    const prompt = String(formData.get("prompt") || "").trim();
    const dimensions = String(formData.get("dimensions") || "").trim();
    const room = String(formData.get("room") || "").trim();
    const style = String(formData.get("style") || "").trim();
    const palette = String(formData.get("palette") || "").trim();

    if (!image || typeof image === "string") {
      return Response.json(
        { success: false, error: "Please upload a room photo." },
        { status: 400 }
      );
    }

    if (!image.type?.startsWith("image/")) {
      return Response.json(
        { success: false, error: "Uploaded file must be an image." },
        { status: 400 }
      );
    }

    if (image.size > 8 * 1024 * 1024) {
      return Response.json(
        { success: false, error: "Image must be smaller than 8MB." },
        { status: 400 }
      );
    }

    if (!prompt) {
      return Response.json(
        { success: false, error: "Please describe what you want to change." },
        { status: 400 }
      );
    }

    const imagePrompt = [
      "Edit the uploaded real interior room photo, do not create a different room.",
      "Keep the same camera angle, perspective, wall positions, floor, ceiling, windows, doors, room shape, and main layout.",
      "Only restyle furniture, decor, colors, lighting, and finishes requested by the user.",
      "The result must look like the same exact room after interior design changes.",
      room ? `Room type: ${room}.` : "",
      style ? `Design style: ${style}.` : "",
      palette ? `Color palette: ${palette}.` : "",
      dimensions ? `Room dimensions: ${dimensions}.` : "",
      `User request: ${prompt}.`,
      "Do not change the architecture, camera position, window placement, door placement, or room size.",
      "Do not add text, watermarks, logos, distorted furniture, or unrealistic geometry.",
      "Return one photorealistic edited image.",
    ]
      .filter(Boolean)
      .join(" ");

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    if (hfToken) {
      try {
        const imageUrl = await generateWithHuggingFace({
          imageBuffer,
          imageType: image.type,
          prompt: imagePrompt,
        });

        if (imageUrl) {
          return Response.json({ success: true, imageUrl });
        }
      } catch (hfError) {
        console.error("Hugging Face image generation error:", hfError);
      }
    }

    if (process.env.POLLINATIONS_API_KEY) {
      try {
        const imageUrl = await generateWithPollinations({
          prompt: buildPollinationsPrompt({ room, style, palette, prompt }),
        });

        if (imageUrl) {
          return Response.json({ success: true, imageUrl });
        }
      } catch (pollinationsError) {
        console.error("Pollinations image generation error:", pollinationsError);
        return Response.json(
          {
            success: false,
            error: getCleanProviderError(pollinationsError),
          },
          { status: 500 }
        );
      }
    }

    if (!geminiApiKey) {
      return Response.json(
        { success: false, error: "Vendos POLLINATIONS_API_KEY ne environment variables per gjenerim fotoje." },
        { status: 500 }
      );
    }

    const base64Image = imageBuffer.toString("base64");
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: imagePrompt },
                {
                  inline_data: {
                    mime_type: image.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["Image"],
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      const geminiError = getGeminiErrorMessage(errText);
      console.error("Gemini image generation error:", geminiRes.status, geminiError);
      return Response.json(
        { success: false, error: getClientErrorMessage(geminiRes.status, geminiError) },
        { status: geminiRes.status }
      );
    }

    const geminiData = await geminiRes.json();
    const imageUrl = getImageFromGeminiResponse(geminiData);

    if (!imageUrl) {
      console.error("Gemini did not return image data:", JSON.stringify(geminiData));
      return Response.json(
        { success: false, error: "Image model did not return an image." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Unhandled visualizer error:", error);
    return Response.json(
      { success: false, error: "Ndodhi nje gabim gjate gjenerimit te fotos." },
      { status: 500 }
    );
  }
}
