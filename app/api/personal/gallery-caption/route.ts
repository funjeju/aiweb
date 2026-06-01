import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

    // 이미지 fetch → base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("이미지를 가져올 수 없습니다");
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = (imgRes.headers.get("content-type") || "image/jpeg").split(";")[0];

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ caption: "" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { temperature: 0.9 },
    });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      `이 사진을 보고 한 줄의 감성적인 한국어 문장을 써줘.
조건:
- 20자 내외로 짧게
- 시적이고 여운이 남는 느낌
- 해시태그나 이모지 없이 순수 문장으로
- 사진 속 분위기·감정·계절감을 담을 것
문장만 반환해.`,
    ]);

    const caption = result.response.text().trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ caption });
  } catch (e) {
    console.error("[gallery-caption]", e);
    return NextResponse.json({ caption: "" });
  }
}
