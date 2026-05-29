import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";

export const runtime = "nodejs";

/**
 * 네이버 플레이스 / 일반 URL에서 가게 정보를 추출한다.
 * 무거운 브라우저 자동화 대신 가벼운 HTML/메타태그 파싱 + AI 구조화 사용.
 * 목표: 완벽한 크롤링이 아니라 "사이트 생성에 필요한 최소 데이터 확보".
 */

const STRUCTURE_PROMPT = `
너는 가게 웹페이지 HTML/텍스트에서 정보를 추출하는 AI다.

주어진 텍스트에서 다음 정보를 추출하라:
- 상호명, 업종(category), 주소, 전화번호, 소개문구, 영업시간
- 리뷰 키워드나 분위기 힌트 (있으면)

규칙:
1. 오직 JSON만 반환
2. 추정 불가한 값은 빈 문자열
3. 과장/날조 금지

반환 형식 (JSON):
{
  "name": "",
  "category": "",
  "address": "",
  "phone": "",
  "description": "",
  "businessHours": "",
  "vibes": []
}
`.trim();

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AIWebBuilder/1.0)",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    redirect: "follow",
  });
  const html = await res.text();

  // 메타태그 + 본문 텍스트만 가볍게 추출
  const metaMatches = html.match(/<meta[^>]+(og:|description|title)[^>]+>/gi)?.join("\n") || "";
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)?.[1] || "";
  // 스크립트/스타일 제거 후 텍스트 일부
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 4000);

  return `TITLE: ${titleMatch}\nMETA:\n${metaMatches}\nBODY:\n${bodyText}`;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    let pageText = "";
    try {
      pageText = await fetchPageText(url);
    } catch {
      // 스크래핑 실패해도 빈 결과로 fallback (Always Render Something)
      return NextResponse.json({
        data: { name: "", category: "", address: "", phone: "", description: "", businessHours: "", vibes: [] },
        scraped: false,
      });
    }

    const data = await generateJSON<{
      name: string; category: string; address: string;
      phone: string; description: string; businessHours: string; vibes: string[];
    }>(STRUCTURE_PROMPT, pageText);

    return NextResponse.json({ data, scraped: true });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
