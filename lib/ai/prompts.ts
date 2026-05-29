import type { SiteType } from "@/lib/types/site";

export const SITE_GENERATION_SYSTEM_PROMPT = `
너는 지역 소상공인 웹빌더를 돕는 수석 로컬 마케터이자 웹사이트 큐레이터다.

역할:
- 입력 데이터를 분석하여 웹사이트 JSON 데이터를 생성한다
- Pattern Library에서만 블록 타입을 선택한다 (랜덤 생성 금지)
- 리뷰 기반 마케팅 카피를 생성한다
- 빈 화면은 절대 허용하지 않는다 (Always Render Something)

규칙:
1. 반드시 유효한 JSON만 반환한다
2. 랜덤 디자인 생성 금지
3. HTML/CSS 코드 생성 금지
4. Pattern Library의 componentType만 사용
5. 누락 데이터는 업종에 맞는 placeholder로 채운다
6. 카피는 과장 없이 리뷰 기반으로 짧고 직관적으로

Pattern Library (사용 가능한 componentType):
- HeroCentered-v1, HeroCentered-v2, HeroCentered-v3
- HeroSplit-v1
- MenuGrid-v1, MenuGrid-v2
- FeaturedCard-v1, FeaturedCard-v2, FeaturedCard-v3
- GalleryGrid-v1, GalleryMasonry-v2
- ReviewCarousel-v1, ReviewCard-v2
- MapBlock-v1
- CTABanner-v1, CTABanner-v2
- ContactBlock-v1
- PriceList-v1
- BusinessHours-v1
`.trim();

export function buildGenerationPrompt(input: {
  businessName?: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string;
  reviews?: string[];
  menuItems?: string;
  vibes?: string[];
  siteType?: SiteType;
}): string {
  return `
다음 소상공인 정보로 웹사이트 데이터를 생성하라.

입력 데이터:
- 상호명: ${input.businessName || "미입력"}
- 업종: ${input.category || input.siteType || "일반"}
- 소개: ${input.description || "미입력"}
- 주소: ${input.address || "미입력"}
- 전화: ${input.phone || "미입력"}
- 리뷰: ${input.reviews?.join(", ") || "없음"}
- 메뉴: ${input.menuItems || "없음"}
- 분위기: ${input.vibes?.join(", ") || "없음"}

반환 형식 (JSON):
{
  "siteType": "cafe|restaurant|beauty|stay|general",
  "themeId": "warm-ocean|jeju-warm|luxury-modern|minimal-clean|vintage-cozy|fresh-green",
  "heroTitle": "...",
  "heroSubtitle": "...",
  "heroBadge": "...",
  "heroCtaText": "...",
  "featuredTitle": "...",
  "featuredItems": [
    { "title": "...", "description": "...", "badge": "..." }
  ],
  "reviewTitle": "...",
  "reviews": [
    { "author": "방문자", "rating": 5, "text": "..." }
  ],
  "layout": [
    { "componentType": "HeroCentered-v2" },
    { "componentType": "FeaturedCard-v2" },
    { "componentType": "GalleryGrid-v1" },
    { "componentType": "ReviewCarousel-v1" },
    { "componentType": "MapBlock-v1" },
    { "componentType": "CTABanner-v1" }
  ]
}
`.trim();
}

export function buildCopyPrompt(reviews: string[], businessName: string, category: string): string {
  return `
다음 리뷰를 분석하여 "${businessName}" (${category})의 마케팅 카피를 생성하라.

리뷰:
${reviews.map((r, i) => `${i + 1}. ${r}`).join("\n")}

규칙:
- 과장 없이 리뷰 기반
- 짧고 직관적 (20자 이내)
- 업종 톤 유지
- 지역감 살리기

반환 형식 (JSON):
{
  "heroTitle": "...",
  "heroSubtitle": "...",
  "badge": "..."
}
`.trim();
}

export function buildOcrMenuPrompt(): string {
  return `
이 메뉴판 이미지에서 메뉴 정보를 추출하라.

규칙:
- 메뉴명과 가격만 추출
- 가격은 숫자만 (원 단위)
- 추정이 불가능한 항목은 제외
- 카테고리가 있으면 포함

반환 형식 (JSON):
{
  "menuItems": [
    { "name": "아메리카노", "price": 5000, "category": "커피" }
  ]
}
`.trim();
}
