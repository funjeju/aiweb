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
export async function generateWithSearch(prompt: string): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-flash-latest",
    // SDK 타입에 googleSearch가 없을 수 있어 캐스팅
    tools: [{ googleSearch: {} }] as unknown as Parameters<
      ReturnType<typeof getGenAI>["getGenerativeModel"]
    >[0]["tools"],
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
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
}

export async function searchBusinessInfo(
  name: string,
  category?: string,
  region?: string
): Promise<BusinessInfo> {
  const query = [
    `"${name}"`,
    category || "",
    region || "",
    "가게의 주소, 전화번호, 영업시간, 대표 메뉴와 가격, 분위기, 손님 후기를 웹에서 찾아 알려줘.",
    "실제로 검색되는 정보만 말하고, 찾을 수 없으면 '정보 없음'이라고 해.",
  ]
    .filter(Boolean)
    .join(" ");

  let searchText = "";
  try {
    searchText = await generateWithSearch(query);
  } catch (err) {
    console.error("grounding search failed:", err);
    searchText = "";
  }

  const empty: BusinessInfo = {
    name: "", category: category || "", address: "", phone: "",
    description: "", businessHours: "", menuItems: [], reviews: [], vibes: [], found: false,
  };

  if (!searchText || searchText.includes("정보 없음")) {
    return empty;
  }

  const STRUCT_PROMPT = `
다음은 웹 검색으로 수집한 가게 정보 텍스트다. 여기서 사실만 추출해 JSON으로 정리하라.
규칙: 텍스트에 없는 값은 빈 문자열/빈 배열. 절대 추측·날조 금지.

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
    const data = await generateJSON<Omit<BusinessInfo, "found">>(STRUCT_PROMPT, searchText);
    const found = !!(data.name || data.address || data.phone || (data.menuItems && data.menuItems.length));
    return { ...empty, ...data, category: data.category || category || "", found };
  } catch {
    return empty;
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
