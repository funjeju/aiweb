import { generateJSON, analyzeImageJSON } from "./gemini";
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
import { generateSiteId, slugify } from "@/lib/utils";
import { TEMPLATES } from "@/lib/types/site";
import { randomUUID } from "crypto";

interface AIGenerationInput {
  businessName: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string;
  reviews?: string[];
  menuItems?: string;
  vibes?: string[];
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

  const siteId = generateSiteId(input.businessName);
  const subdomain = slugify(input.businessName);
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
    menuData: { source: "manual", items: [] },
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
    id: randomUUID(),
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
