import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI 미설정" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { temperature: 0.3 },
    });

    const prompt = `You are an astronomy expert.
The user's IP address is: ${ip}
The user's nickname is: ${name || "unknown"}

Step 1: Based on the IP address, determine the approximate country/region (city-level precision is NOT needed — country or broad region is enough).
Step 2: For that latitude, list 30 to 40 real circumpolar stars that are visible year-round (stars that never set below the horizon). A star is circumpolar if its declination > (latitude - 90°).

Return ONLY a valid JSON array. No explanation, no markdown, no code block.
Format: [{"name":"Polaris","nameEn":"Polaris","nameKo":"폴라리스","slug":"polaris","ra":37.9,"dec":89.3,"mag":1.98},...]

Rules:
- Only include stars with magnitude < 4.0
- ALWAYS use the official English name for "name" and "nameEn" fields (never Korean)
- For "nameKo" provide the Korean transliteration
- For "slug" use lowercase English with hyphens (e.g. "kaus-australis")
- Strictly ensure all stars satisfy the circumpolar condition for the detected latitude
- Return between 30 and 40 stars`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const stars = JSON.parse(cleaned);

    return NextResponse.json({ stars });
  } catch (e) {
    console.error("[universe/stars]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
