import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error("AI returned invalid JSON");
  }
}

export async function analyzeImageJSON<T>(
  systemPrompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<T> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    "이 이미지를 분석하라.",
  ]);

  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error("AI returned invalid JSON");
  }
}
