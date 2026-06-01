/**
 * Tool Suite (study.funjeju.com) 슬러그 Registry API 래퍼.
 *
 * .env.local:
 *   NEXT_PUBLIC_SLUG_REGISTRY_URL=https://study.funjeju.com/api/slug/create   ← 전체 create URL
 *   NEXT_PUBLIC_SLUG_REGISTRY_KEY=study-slug-key-2024
 *   NEXT_PUBLIC_SLUG_DOMAIN=https://study.funjeju.com                          ← 베이스 도메인
 */

// create 엔드포인트 전체 URL
const REGISTRY_CREATE_URL = (process.env.NEXT_PUBLIC_SLUG_REGISTRY_URL ?? "").replace(/\/$/, "");
const REGISTRY_KEY        = process.env.NEXT_PUBLIC_SLUG_REGISTRY_KEY ?? "";
// 베이스 도메인 (단축 URL 구성 + check 엔드포인트 파생에 사용)
const REGISTRY_BASE       = (process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "https://study.funjeju.com").replace(/\/$/, "");

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
  if (!REGISTRY_BASE) return { available: true };
  try {
    const res = await fetch(`${REGISTRY_BASE}/api/slug/check/${encodeURIComponent(slug)}`, {
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

  if (!REGISTRY_CREATE_URL) {
    // stub 모드: 환경변수 미설정 시 베이스 도메인으로 URL 구성
    return { success: true, final_slug: slug, short_url: `${REGISTRY_BASE}/${slug}` };
  }

  try {
    const res = await fetch(REGISTRY_CREATE_URL, {  // URL 직접 사용 (경로 추가 없음)
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        target_url,
        preferred_slug: slug,
      }),
    });
    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      final_slug: data.final_slug ?? data.slug ?? slug,
      short_url:  data.short_url  ?? data.url  ?? `${REGISTRY_BASE}/${data.final_slug ?? slug}`,
      suggestions: data.suggestions,
      error: data.error,
    };
  } catch (e) {
    return { success: false, final_slug: slug, short_url: "", error: "Registry 연결 실패" };
  }
}

/* ─── 슬러그 target_url 업데이트 ──────────────── */

export async function updateSlugTarget(slug: string, newTargetUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!REGISTRY_BASE) return { success: false, error: "Registry 미설정" };
  try {
    const res = await fetch(`${REGISTRY_BASE}/api/slug/${encodeURIComponent(slug)}/target`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ target_url: newTargetUrl }),
    });
    if (res.ok) return { success: true };
    // fallback: 삭제 후 재등록
    const del = await fetch(`${REGISTRY_BASE}/api/slug/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!del.ok && del.status !== 404) return { success: false, error: `DELETE 실패: ${del.status}` };
    const created = await registerSlug({ slug, target_url: newTargetUrl });
    return { success: created.success, error: created.error };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/* ─── 슬러그 변경 ───────────────────────────── */

export async function updateSlug(params: {
  old_slug: string;
  new_slug: string;
  target_url: string;
  owner_id?: string;
}): Promise<SlugCreateResult> {
  return registerSlug({ slug: params.new_slug, target_url: params.target_url, owner_id: params.owner_id });
}
