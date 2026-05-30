import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";

export const runtime = "nodejs";

const LANG_NAME: Record<string, string> = {
  en: "English",
  zh: "Chinese (Simplified)",
};

/**
 * 가게 사이트의 한국어 텍스트들을 한 번에 번역한다.
 * 입력: { texts: string[], lang: "en"|"zh" }
 * 출력: { translations: string[] } (입력과 동일 순서/길이)
 */
export async function POST(req: NextRequest) {
  try {
    const { texts, lang } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }
    const target = LANG_NAME[lang];
    if (!target) return NextResponse.json({ error: "unsupported lang" }, { status: 400 });

    const system = `You are a professional translator for Korean local business websites aimed at tourists.
Translate each Korean text into natural, concise ${target}.
Rules:
- Keep proper nouns (store names) recognizable; you may transliterate.
- Do NOT translate phone numbers, prices(원 → keep or localize sensibly), URLs.
- Return ONLY valid JSON, same array length and order as input.`;

    const prompt = `Translate this JSON array of Korean strings into ${target}.
Return format: { "translations": ["...", "..."] } with EXACTLY ${texts.length} items in the same order.

Input:
${JSON.stringify(texts)}`;

    const result = await generateJSON<{ translations: string[] }>(system, prompt);
    const translations = Array.isArray(result.translations) ? result.translations : [];
    // 길이 안 맞으면 원문 폴백
    const safe = texts.map((t: string, i: number) => translations[i] || t);
    return NextResponse.json({ translations: safe });
  } catch (err) {
    console.error("translate error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
