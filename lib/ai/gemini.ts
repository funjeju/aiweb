import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error("AI returned invalid JSON");
  }
}

/**
 * Google Search grounding을 사용해 실제 웹 검색 기반으로 답변을 생성한다.
 * (상호명만으로 실제 가게 정보를 찾을 때 사용 — 환각/날조를 줄인다)
 * grounding 사용 시 JSON 응답 모드를 못 쓰므로 텍스트로 반환한다.
 */
export interface SearchResult {
  text: string;
  /** 실제 웹 검색 근거가 있었는지 (grounding metadata 존재 여부) */
  grounded: boolean;
  /** 참조한 출처 URL/도메인 목록 */
  sources: string[];
}

export async function generateWithSearch(prompt: string): Promise<SearchResult> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-flash-latest",
    // SDK 타입에 googleSearch가 없을 수 있어 캐스팅
    tools: [{ googleSearch: {} }] as unknown as Parameters<
      ReturnType<typeof getGenAI>["getGenerativeModel"]
    >[0]["tools"],
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // grounding 메타데이터에서 실제 검색 근거/출처를 추출
  // (이게 비어 있으면 모델이 웹 검색 없이 자체 지식/추측으로 답한 것 → 신뢰 불가)
  const candidate = result.response.candidates?.[0] as
    | { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }
    | undefined;
  const chunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const sources = chunks
    .map((c) => c.web?.uri || c.web?.title || "")
    .filter(Boolean);

  return { text, grounded: sources.length > 0, sources };
}

/**
 * 상호명(+업종/지역)으로 웹 검색해 실제 가게 정보를 구조화한다.
 * 1단계: Google Search grounding으로 실제 정보 수집(텍스트)
 * 2단계: 수집한 텍스트를 JSON으로 구조화 (없는 값은 빈 값)
 */
export interface BusinessInfo {
  name: string;
  category: string;
  address: string;
  phone: string;
  description: string;
  businessHours: string;
  menuItems: Array<{ name: string; price: number }>;
  reviews: string[];
  vibes: string[];
  found: boolean;
  /** 실제 웹 검색 출처가 확인됐는지 */
  grounded: boolean;
  sources: string[];
}

export async function searchBusinessInfo(
  name: string,
  category?: string,
  region?: string
): Promise<BusinessInfo> {
  const query = [
    `${name}`,
    category || "",
    region || "",
    "이 가게를 웹에서 검색해서 주소, 전화번호, 영업시간, 소개, 대표 메뉴와 가격, 손님 후기를 정리해줘.",
    "야놀자·아고다·트립닷컴·네이버·인스타그램 등 검색 결과를 적극 활용해.",
  ]
    .filter(Boolean)
    .join(" ");

  const empty: BusinessInfo = {
    name: "", category: category || "", address: "", phone: "",
    description: "", businessHours: "", menuItems: [], reviews: [], vibes: [],
    found: false, grounded: false, sources: [],
  };

  let search: SearchResult;
  try {
    search = await generateWithSearch(query);
  } catch (err) {
    console.error("grounding search failed:", err);
    return empty;
  }

  if (!search.text || search.text.trim().length < 10) {
    return { ...empty, grounded: search.grounded, sources: search.sources };
  }

  const STRUCT_PROMPT = `
다음은 웹 검색으로 수집한 가게 정보 텍스트다. 여기서 사실 정보를 추출해 JSON으로 정리하라.
규칙:
- 텍스트에 나온 주소/전화/영업시간/소개는 그대로 사용한다.
- 메뉴는 가격이 명시된 것만 넣는다. 가격을 모르면 그 메뉴는 제외(0 금지).
- 후기는 텍스트에 실제로 인용된 후기 문장만. 없으면 빈 배열.
- 텍스트에 전혀 없는 항목은 빈 값으로 둔다 (지어내지 말 것).

반환 형식 (JSON):
{
  "name": "", "category": "", "address": "", "phone": "",
  "description": "", "businessHours": "",
  "menuItems": [{ "name": "", "price": 0 }],
  "reviews": [],
  "vibes": []
}
`.trim();

  try {
    const data = await generateJSON<Omit<BusinessInfo, "found" | "grounded" | "sources">>(STRUCT_PROMPT, search.text);
    // 가격 0 이하(=가격 미확인) 메뉴는 제외 (가짜 가격 방지)
    const cleanMenu = (data.menuItems ?? []).filter((m) => m.name && m.price > 0);
    const found = !!(data.name || data.address || data.phone || data.description || cleanMenu.length);
    return {
      ...empty,
      ...data,
      menuItems: cleanMenu,
      category: data.category || category || "",
      found,
      grounded: search.grounded,
      sources: search.sources,
    };
  } catch {
    return { ...empty, grounded: search.grounded, sources: search.sources };
  }
}

export async function analyzeImageJSON<T>(
  systemPrompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<T> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    "이 이미지를 분석하라.",
  ]);

  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error("AI returned invalid JSON");
  }
}
