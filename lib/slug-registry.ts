/**
 * Tool Suite (study.funjeju.com) 슬러그 Registry API 래퍼.
 *
 * .env.local:
 *   NEXT_PUBLIC_SLUG_REGISTRY_URL=https://study.funjeju.com
 *   NEXT_PUBLIC_SLUG_REGISTRY_KEY=study-slug-key-2024
 *   NEXT_PUBLIC_SLUG_DOMAIN=study.funjeju.com
 */

const REGISTRY_URL = (process.env.NEXT_PUBLIC_SLUG_REGISTRY_URL ?? "").replace(/\/$/, "");
const REGISTRY_KEY = process.env.NEXT_PUBLIC_SLUG_REGISTRY_KEY ?? "";
const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "study.funjeju.com";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (REGISTRY_KEY) h["x-api-key"] = REGISTRY_KEY;
  return h;
}

/* ─── 응답 타입 ─────────────────────────────── */

export interface SlugCreateResult {
  success: boolean;
  final_slug: string;
  short_url: string;
  suggestions?: string[];
  error?: string;
}

export interface SlugCheckResult {
  available: boolean;
  suggestions?: string[];
}

/* ─── 형식 검사 / 정규화 ───────────────────── */

export function validateSlugFormat(slug: string): string | null {
  if (slug.length < 3) return "3자 이상 입력해주세요";
  if (slug.length > 30) return "30자 이하로 입력해주세요";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug))
    return "영문 소문자·숫자·하이픈(-)만 사용 가능합니다";
  return null;
}

export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

/* ─── 슬러그 중복 체크 ──────────────────────── */

export async function checkSlugAvailable(slug: string): Promise<SlugCheckResult> {
  if (!REGISTRY_URL) return { available: true };
  try {
    const res = await fetch(`${REGISTRY_URL}/api/slug/check/${encodeURIComponent(slug)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return { available: true };
    return res.json();
  } catch {
    return { available: true };
  }
}

/* ─── 슬러그 등록 ───────────────────────────── */

export async function registerSlug(params: {
  slug: string;
  target_url: string;
  owner_id?: string;
}): Promise<SlugCreateResult> {
  const { slug, target_url } = params;

  if (!REGISTRY_URL) {
    // stub 모드: API 미설정 시 입력값 그대로 반환
    return { success: true, final_slug: slug, short_url: `${PUBLIC_DOMAIN}/${slug}` };
  }

  try {
    const res = await fetch(`${REGISTRY_URL}/api/slug/create`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        target_url,
        preferred_slug: slug,   // API 스펙: preferred_slug
      }),
    });
    const data = await res.json();
    // 응답 필드 정규화 (API가 slug/url로 내려줄 수도 있음)
    return {
      success: data.success ?? res.ok,
      final_slug: data.final_slug ?? data.slug ?? slug,
      short_url:  data.short_url  ?? data.url  ?? `${PUBLIC_DOMAIN}/${data.final_slug ?? slug}`,
      suggestions: data.suggestions,
      error: data.error,
    };
  } catch (e) {
    return { success: false, final_slug: slug, short_url: "", error: "Registry 연결 실패" };
  }
}

/* ─── 슬러그 변경 ───────────────────────────── */

export async function updateSlug(params: {
  old_slug: string;
  new_slug: string;
  target_url: string;
  owner_id?: string;
}): Promise<SlugCreateResult> {
  // TODO: API에 PATCH /api/slug/:old_slug 생기면 교체
  return registerSlug({ slug: params.new_slug, target_url: params.target_url, owner_id: params.owner_id });
}
