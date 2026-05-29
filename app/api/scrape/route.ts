import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";

export const runtime = "nodejs";

/**
 * 네이버 플레이스 URL에서 가게 정보를 추출한다.
 *
 * 핵심: 네이버 지도(map.naver.com)는 JS 렌더링 SPA라 초기 HTML에 데이터가 없다.
 * 따라서 ① 단축 URL 리다이렉트를 따라가 placeId를 뽑고
 *       ② 데이터가 SSR로 들어있는 m.place.naver.com 모바일 페이지를 모바일 UA로 가져와
 *       ③ 인라인 JSON/메타태그 + 본문을 AI로 구조화한다.
 */

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const STRUCTURE_PROMPT = `
너는 네이버 플레이스 페이지 텍스트에서 가게 정보를 추출하는 AI다.

주어진 텍스트(HTML/인라인 JSON 포함)에서 실제로 존재하는 정보만 추출하라.

규칙:
1. 오직 JSON만 반환
2. 텍스트에 명시되지 않은 값은 빈 문자열/빈 배열 (절대 추측·날조 금지)
3. 메뉴는 실제로 발견된 것만, 가격은 숫자(원)만

반환 형식 (JSON):
{
  "name": "",
  "category": "",
  "address": "",
  "phone": "",
  "description": "",
  "businessHours": "",
  "menuItems": [ { "name": "", "price": 0 } ],
  "vibes": []
}
`.trim();

function extractPlaceId(url: string): string | null {
  const m = url.match(/place\/(\d+)/) || url.match(/\/(\d{6,})/);
  return m ? m[1] : null;
}

async function resolveFinalUrl(shortUrl: string): Promise<string> {
  const res = await fetch(shortUrl, {
    headers: { "User-Agent": MOBILE_UA, "Accept-Language": "ko-KR,ko;q=0.9" },
    redirect: "follow",
  });
  return res.url || shortUrl;
}

async function fetchPlaceText(placeId: string): Promise<string> {
  // 카테고리를 모르므로 범용 place 경로 + 모바일 UA로 SSR 데이터를 받는다.
  const candidates = [
    `https://m.place.naver.com/place/${placeId}/home`,
    `https://m.place.naver.com/restaurant/${placeId}/home`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": MOBILE_UA, "Accept-Language": "ko-KR,ko;q=0.9" },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();

      // 인라인 상태 JSON 추출 (네이버는 __APOLLO_STATE__ 등에 데이터를 심는다)
      const apollo = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
      const meta = html.match(/<meta[^>]+(og:|name="description")[^>]+>/gi)?.join("\n") || "";
      const jsonChunk = apollo ? apollo[1].slice(0, 12000) : "";

      // 본문 텍스트 일부도 함께
      const bodyText = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 3000);

      const combined = `META:\n${meta}\n\nINLINE_JSON:\n${jsonChunk}\n\nBODY:\n${bodyText}`;
      // 의미있는 데이터가 있는지 대략 확인 (상호/주소 키워드)
      if (jsonChunk.length > 200 || meta.includes("og:title")) {
        return combined;
      }
    } catch {
      continue;
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    const empty = {
      name: "", category: "", address: "", phone: "",
      description: "", businessHours: "", menuItems: [], vibes: [],
    };

    let finalUrl = url;
    try {
      finalUrl = await resolveFinalUrl(url);
    } catch { /* 리다이렉트 실패해도 원본 URL로 진행 */ }

    const placeId = extractPlaceId(finalUrl);
    if (!placeId) {
      return NextResponse.json({ data: empty, scraped: false, reason: "no-place-id" });
    }

    const pageText = await fetchPlaceText(placeId);
    if (!pageText) {
      return NextResponse.json({ data: empty, scraped: false, reason: "blocked-or-empty", placeId });
    }

    const data = await generateJSON<typeof empty>(STRUCTURE_PROMPT, pageText);

    // 실제로 의미있는 데이터를 얻었는지 판정
    const hasData = !!(data.name || data.address || data.phone || (data.menuItems && data.menuItems.length));

    return NextResponse.json({ data, scraped: hasData, placeId });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
