type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type GenerateOptions = {
  maxTokens?: number;
  temperature?: number;
};

type GenerateResult = {
  text: string;
  provider: "nvidia" | "gemini";
};

/*
 * -----------------------------------------------------
 * NVIDIA (openai/gpt-oss-20b) — OpenAI-compatible endpoint
 * -----------------------------------------------------
 */
async function callNvidia(
  messages: ChatMessage[],
  options: GenerateOptions
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is missing.");
  }

  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: 1,
        max_tokens: options.maxTokens ?? 1000,
        stream: false,
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `NVIDIA request failed (${response.status}): ${detail}`
    );
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("NVIDIA returned an empty response.");
  }

  return text;
}

/*
 * -----------------------------------------------------
 * Gemini — fallback
 * -----------------------------------------------------
 */
async function callGemini(
  prompt: string,
  options: GenerateOptions
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 1000,
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

/*
 * -----------------------------------------------------
 * Public entry point: NVIDIA first, Gemini as fallback.
 * `prompt` is used as a single user message for NVIDIA
 * and as the raw `contents` string for Gemini, so both
 * routes can keep building one big prompt string like
 * they already do.
 * -----------------------------------------------------
 */
export async function generateWithFallback(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  try {
    const text = await callNvidia(
      [{ role: "user", content: prompt }],
      options
    );

    return { text, provider: "nvidia" };
  } catch (nvidiaError) {
    console.error(
      "StudyBuddy AI: NVIDIA call failed, falling back to Gemini:",
      nvidiaError
    );

    try {
      const text = await callGemini(prompt, options);
      return { text, provider: "gemini" };
    } catch (geminiError) {
      console.error(
        "StudyBuddy AI: Gemini fallback also failed:",
        geminiError
      );

      throw new Error(
        "Both AI providers are currently unavailable. Please try again shortly."
      );
    }
  }
}

/*
 * Some models (gpt-oss especially) sometimes wrap JSON
 * output in markdown code fences despite instructions not
 * to. Strip those before JSON.parse.
 */
export function stripCodeFence(text: string): string {
  const trimmed = text.trim();

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fenced ? fenced[1].trim() : trimmed;
}