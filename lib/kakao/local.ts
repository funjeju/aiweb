/**
 * 카카오 로컬 API — 한국 가게 정보(주소/전화/좌표/카테고리)를 정확히 가져온다.
 * 구글 검색(grounding)보다 한국 소상공인 데이터가 풍부하고 정확하다.
 * 서버사이드에서만 호출 (REST API 키 사용).
 */

export interface KakaoPlace {
  name: string;
  category: string;
  address: string; // 도로명 우선, 없으면 지번
  phone: string;
  lat: number;
  lng: number;
  placeUrl: string;
}

interface KakaoDoc {
  place_name: string;
  category_name: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
  place_url: string;
}

function getKakaoRestKey(): string | undefined {
  return process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
}

/** 카테고리 문자열에서 마지막 세부 분류만 추출 (예: "음식점 > 카페 > 디저트" → "디저트") */
function simplifyCategory(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(">").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
}

export async function searchKakaoPlace(query: string, region?: string): Promise<KakaoPlace | null> {
  const key = getKakaoRestKey();
  if (!key) {
    console.warn("KAKAO_REST_API_KEY not set");
    return null;
  }

  const q = [region, query].filter(Boolean).join(" ").trim();
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=5`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    if (!res.ok) {
      console.error("kakao local api error:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { documents: KakaoDoc[] };
    const doc = data.documents?.[0];
    if (!doc) return null;

    return {
      name: doc.place_name,
      category: doc.category_group_name || simplifyCategory(doc.category_name),
      address: doc.road_address_name || doc.address_name || "",
      phone: doc.phone || "",
      lat: Number(doc.y),
      lng: Number(doc.x),
      placeUrl: doc.place_url || "",
    };
  } catch (err) {
    console.error("kakao local search failed:", err);
    return null;
  }
}
