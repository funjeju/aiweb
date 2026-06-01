/**
 * Tool Suite (중앙 URL Registry) API 래퍼.
 * NEXT_PUBLIC_SLUG_REGISTRY_URL 환경변수가 없으면 stub 모드로 동작.
 *
 * API 스펙 확정 시:
 *  1. NEXT_PUBLIC_SLUG_REGISTRY_URL 에 실제 엔드포인트 설정
 *  2. 필요한 경우 NEXT_PUBLIC_SLUG_REGISTRY_KEY 로 인증 헤더 추가
 *  3. 아래 fetch 호출의 body/response 필드명만 실제 스펙에 맞게 조정
 */

const REGISTRY_URL = process.env.NEXT_PUBLIC_SLUG_REGISTRY_URL ?? "";
const REGISTRY_KEY = process.env.NEXT_PUBLIC_SLUG_REGISTRY_KEY ?? "";
const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "study.funjeju.co";
const PROJECT_TYPE = "constellation";

function authHeaders(): Record<string, string> {
  return REGISTRY_KEY ? { Authorization: `Bearer ${REGISTRY_KEY}` } : {};
}

/* ─── 응답 타입 ─────────────────────────────────────── */

export interface SlugCreateResult {
  success: boolean;
  final_slug: string;
  short_url: string;
  /** 중복 시 Registry가 추천한 대안 슬러그 목록 */
  suggestions?: string[];
  error?: string;
}

export interface SlugCheckResult {
  available: boolean;
  suggestions?: string[];
}

/* ─── 슬러그 형식 검사 (클라이언트 즉시 검증) ─────── */

export function validateSlugFormat(slug: string): string | null {
  if (slug.length < 3) return "3자 이상 입력해주세요";
  if (slug.length > 30) return "30자 이하로 입력해주세요";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug))
    return "영문 소문자·숫자·하이픈(-)만 사용 가능합니다";
  return null;
}

/** 입력값 → 슬러그 형식으로 정규화 (영문 소문자 변환 + 허용 외 문자 제거) */
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

/* ─── 슬러그 중복 체크 ───────────────────────────── */

export async function checkSlugAvailable(slug: string): Promise<SlugCheckResult> {
  if (!REGISTRY_URL) {
    // stub: 항상 사용 가능 (API 미연결)
    return { available: true };
  }
  try {
    const res = await fetch(`${REGISTRY_URL}/api/slug/check/${encodeURIComponent(slug)}`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    return res.json();
  } catch {
    return { available: true }; // 네트워크 오류 시 낙관적으로 허용
  }
}

/* ─── 슬러그 등록 (생성 완료 시 호출) ─────────────── */

export async function registerSlug(params: {
  slug: string;
  target_url: string;
  owner_id?: string;
}): Promise<SlugCreateResult> {
  const { slug, target_url, owner_id } = params;

  if (!REGISTRY_URL) {
    // stub: API 미연결 시 입력값 그대로 반환
    return {
      success: true,
      final_slug: slug,
      short_url: `${PUBLIC_DOMAIN}/${slug}`,
    };
  }

  try {
    const res = await fetch(`${REGISTRY_URL}/api/slug/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        slug,
        target_url,
        project_type: PROJECT_TYPE,
        owner_id,
      }),
    });
    const data: SlugCreateResult = await res.json();
    return data;
  } catch (e) {
    return {
      success: false,
      final_slug: slug,
      short_url: "",
      error: "Registry 서버에 연결할 수 없습니다.",
    };
  }
}

/** 기존 슬러그 변경 시 호출 (API 스펙 확정 후 구현) */
export async function updateSlug(params: {
  old_slug: string;
  new_slug: string;
  target_url: string;
  owner_id?: string;
}): Promise<SlugCreateResult> {
  // TODO: API 스펙 확정 후 PATCH /api/slug/:old_slug 등으로 구현
  // 현재는 재등록으로 대체
  return registerSlug({ slug: params.new_slug, target_url: params.target_url, owner_id: params.owner_id });
}
