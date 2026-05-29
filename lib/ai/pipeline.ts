import { generateJSON, analyzeImageJSON, searchBusinessInfo } from "./gemini";
import { searchKakaoPlace } from "@/lib/kakao/local";
import {
  SITE_GENERATION_SYSTEM_PROMPT,
  buildGenerationPrompt,
  buildCopyPrompt,
  buildOcrMenuPrompt,
} from "./prompts";
import type {
  SiteSchema,
  SiteType,
  SiteBlock,
  BlockComponentType,
  ThemeId,
  MenuItem,
} from "@/lib/types/site";
import { generateSiteId } from "@/lib/utils";
import { TEMPLATES } from "@/lib/types/site";

interface AIGenerationInput {
  businessName: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string;
  reviews?: string[];
  menuItems?: string;
  vibes?: string[];
  businessHours?: string;
  heroImage?: string;
  galleryImages?: string[];
  ownerId: string;
}

interface AIGenerationResult {
  siteType: SiteType;
  themeId: ThemeId;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge?: string;
  featuredTitle?: string;
  featuredItems?: Array<{ title: string; description: string; badge?: string }>;
  reviewTitle?: string;
  reviews?: Array<{ author: string; rating: number; text: string }>;
  layout?: Array<{ componentType: BlockComponentType }>;
}

export async function generateSiteFromInput(input: AIGenerationInput): Promise<SiteSchema> {
  let searchedMenu: MenuItem[] = [];
  let searchedReviews: Array<{ author: string; rating: number; text: string }> = [];
  // 카카오에서 가져온 좌표 (지도 렌더링용)
  let coordinates: { lat: number; lng: number } | undefined;

  // ── 1단계: 카카오 로컬 검색 — 한국 가게의 주소/전화/좌표/카테고리 (정확) ──
  if (!input.address || !input.phone) {
    try {
      const place = await searchKakaoPlace(input.businessName, input.address);
      if (place) {
        input.address = input.address || place.address;
        input.phone = input.phone || place.phone;
        if (!input.category && place.category) input.category = place.category;
        if (place.lat && place.lng) coordinates = { lat: place.lat, lng: place.lng };
      }
    } catch (err) {
      console.error("kakao local search failed:", err);
    }
  }

  // ── 2단계: 구글 웹 검색(grounding) — 메뉴/리뷰/소개 등 보조 정보 ──
  const needsEnrichment = !input.description || !input.menuItems || !input.reviews?.length;
  if (needsEnrichment) {
    try {
      const info = await searchBusinessInfo(input.businessName, input.category, input.address);
      if (info.found) {
        input.address = input.address || info.address;
        input.phone = input.phone || info.phone;
        input.description = input.description || info.description;
        if (!input.category && info.category) input.category = info.category;
        if (info.businessHours) input.businessHours = info.businessHours;
        if (info.vibes?.length) input.vibes = [...(input.vibes || []), ...info.vibes];

        if (info.menuItems?.length) {
          searchedMenu = info.menuItems
            .filter((m) => m.name && m.price > 0)
            .map((m) => ({ id: crypto.randomUUID(), name: m.name, price: m.price }));
          input.menuItems = searchedMenu.map((m) => `${m.name} ${m.price}원`).join(", ");
        }
        if (info.reviews?.length) {
          searchedReviews = info.reviews
            .filter(Boolean)
            .slice(0, 6)
            .map((text) => ({ author: "방문자", rating: 5, text }));
          input.reviews = info.reviews;
        }
      }
    } catch (err) {
      console.error("business search enrichment failed:", err);
    }
  }

  const prompt = buildGenerationPrompt({
    businessName: input.businessName,
    category: input.category,
    description: input.description,
    address: input.address,
    phone: input.phone,
    reviews: input.reviews,
    menuItems: input.menuItems,
    vibes: input.vibes,
  });

  const ai = await generateJSON<AIGenerationResult>(SITE_GENERATION_SYSTEM_PROMPT, prompt);

  // 검색으로 찾은 실제 리뷰가 있으면 AI 생성분보다 우선
  if (searchedReviews.length > 0) {
    ai.reviews = searchedReviews;
  }

  const siteId = generateSiteId(input.businessName);
  const subdomain = siteId;
  const template = TEMPLATES.find((t) => t.siteType === ai.siteType) ?? TEMPLATES[0];

  const blocks: SiteBlock[] = (ai.layout ?? template.blocks.map((c) => ({ componentType: c }))).map(
    (b, i) => {
      const blockId = `block-${i}-${b.componentType.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const data: Record<string, unknown> = {};

      if (b.componentType.startsWith("Hero")) {
        data.title = ai.heroTitle || input.businessName;
        data.subtitle = ai.heroSubtitle || input.description || "";
        if (ai.heroBadge) data.badge = ai.heroBadge;
      } else if (b.componentType.startsWith("FeaturedCard")) {
        data.title = ai.featuredTitle || "추천";
        data.items = ai.featuredItems || [];
      } else if (b.componentType.startsWith("Review")) {
        data.title = ai.reviewTitle || "리뷰";
        data.reviews = ai.reviews || [];
      }

      return { blockId, componentType: b.componentType, data, visible: true };
    }
  );

  const now = new Date().toISOString();
  const site: SiteSchema = {
    siteId,
    createdAt: now,
    updatedAt: now,
    ownerId: input.ownerId,
    role: "owner",
    siteType: ai.siteType ?? "general",
    published: false,
    subdomain,
    generationMode: { type: "low-input", source: ["manual-input"] },
    merchantInfo: {
      name: input.businessName,
      category: input.category || "",
      phone: input.phone || "",
      address: input.address || "",
      description: input.description || "",
      businessHours: input.businessHours || "",
      ...(coordinates ? { coordinates } : {}),
    },
    externalLinks: {},
    designTokens: {
      themeId: ai.themeId ?? "warm-ocean",
      primaryColor: "",
      fontFamily: "Pretendard",
      radius: "lg",
    },
    contentAssets: {
      heroImage: input.heroImage || "",
      logoImage: "",
      galleryImages: input.galleryImages || [],
      menuImages: [],
      reviewImages: [],
    },
    menuData: { source: searchedMenu.length ? "ai" : "manual", items: searchedMenu },
    layout: blocks,
  };

  return site;
}

interface OcrResult {
  menuItems: Array<{ name: string; price: number; category?: string }>;
}

export async function extractMenuFromImage(
  imageBase64: string,
  mimeType: string
): Promise<MenuItem[]> {
  const result = await analyzeImageJSON<OcrResult>(buildOcrMenuPrompt(), imageBase64, mimeType);
  return (result.menuItems || []).map((item) => ({
    id: crypto.randomUUID(),
    name: item.name,
    price: item.price,
    category: item.category,
  }));
}

interface CopyResult {
  heroTitle: string;
  heroSubtitle: string;
  badge?: string;
}

export async function generateMarketingCopy(
  reviews: string[],
  businessName: string,
  category: string
): Promise<CopyResult> {
  return generateJSON<CopyResult>(
    SITE_GENERATION_SYSTEM_PROMPT,
    buildCopyPrompt(reviews, businessName, category)
  );
}
