import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { season } = await req.json();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI 미설정" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { temperature: 0.2 },
    });

    const prompt = `You are an astronomy expert.
The user's IP address is: ${ip}
Their favorite season is: ${season}

Based on the IP address, determine the approximate country/region (city-level precision is not needed).
Then list 12 to 20 real circumpolar stars visible year-round from that location (stars that never set below the horizon).

Return ONLY a valid JSON array. No explanation, no markdown, no code block. Example format:
[{"name":"Polaris","ra":37.9,"dec":89.3,"mag":1.98},...]

Rules:
- Only include stars with magnitude < 3.5 (bright enough to see with naked eye)
- Include the star's Korean name if well-known, otherwise use the common English name
- Ensure dec values make the star truly circumpolar for the detected latitude
- Return between 12 and 20 stars`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // JSON 파싱 — 혹시 마크다운 코드블록이 있으면 제거
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const stars = JSON.parse(cleaned);

    return NextResponse.json({ stars, season });
  } catch (e) {
    console.error("[universe/stars]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
