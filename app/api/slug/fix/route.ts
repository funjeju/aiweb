import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ── 환경변수 진단 로그 ───────────────────────────
  const REGISTRY_URL  = (process.env.NEXT_PUBLIC_SLUG_REGISTRY_URL ?? "").replace(/\/$/, "");
  const REGISTRY_KEY  = process.env.NEXT_PUBLIC_SLUG_REGISTRY_KEY ?? "";
  const SLUG_DOMAIN   = process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "study.funjeju.com";
  const APP_URL       = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  console.log("[slug/fix] ENV CHECK:", {
    REGISTRY_URL:  REGISTRY_URL  || "(비어있음)",
    REGISTRY_KEY:  REGISTRY_KEY  ? "설정됨" : "(비어있음)",
    SLUG_DOMAIN,
    APP_URL:       APP_URL       || "(비어있음)",
  });

  try {
    const { slug, personalId } = await req.json();
    if (!slug || !personalId) {
      return NextResponse.json({ success: false, error: "slug, personalId 필요" }, { status: 400 });
    }

    const targetUrl = `${APP_URL}/p/${personalId}`;
    console.log("[slug/fix] 요청:", { slug, personalId, targetUrl });

    // ── 레지스트리 연결 불가면 즉시 진단 반환 ────────
    if (!REGISTRY_URL) {
      console.warn("[slug/fix] NEXT_PUBLIC_SLUG_REGISTRY_URL 미설정 — Vercel 환경변수 확인 필요");
      return NextResponse.json({
        success: false,
        error: "REGISTRY_URL 미설정",
        diagnosis: "Vercel 대시보드 > Settings > Environment Variables에서 NEXT_PUBLIC_SLUG_REGISTRY_URL 설정 필요",
      });
    }

    // ── 실제 API 호출 (상세 로그) ───────────────────
    const endpoint = `${REGISTRY_URL}/api/slug/create`;
    const body = JSON.stringify({ target_url: targetUrl, preferred_slug: slug });
    console.log("[slug/fix] 레지스트리 호출:", endpoint, body);

    let registryRes: Response;
    let registryText = "";
    let registryOk = false;
    let registryStatus = 0;

    try {
      registryRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(REGISTRY_KEY ? { "x-api-key": REGISTRY_KEY } : {}),
        },
        body,
      });
      registryStatus = registryRes.status;
      registryText = await registryRes.text();
      registryOk = registryRes.ok;
      console.log("[slug/fix] 레지스트리 응답:", { status: registryStatus, body: registryText });
    } catch (fetchErr) {
      console.error("[slug/fix] fetch 자체 실패:", fetchErr);
      return NextResponse.json({
        success: false,
        error: `네트워크 오류: ${String(fetchErr)}`,
        diagnosis: `${REGISTRY_URL} 에 서버에서 접근 불가. DNS 또는 방화벽 문제.`,
      });
    }

    if (!registryOk) {
      return NextResponse.json({
        success: false,
        error: `레지스트리 ${registryStatus} 응답`,
        registryResponse: registryText,
        diagnosis: registryStatus === 401
          ? "API 키 불일치 — NEXT_PUBLIC_SLUG_REGISTRY_KEY 확인"
          : registryStatus === 404
            ? `엔드포인트 없음 — ${endpoint} 가 study.funjeju.com 프로젝트에 존재하는지 확인`
            : `레지스트리 서버 오류 ${registryStatus}`,
      });
    }

    // ── 성공: 파싱 후 Firestore 업데이트 ────────────
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(registryText); } catch { /* text 그대로 */ }

    const finalSlug = (parsed.final_slug ?? parsed.slug ?? slug) as string;
    const rawShortUrl = (parsed.short_url ?? parsed.url ?? `${SLUG_DOMAIN}/${finalSlug}`) as string;
    const publicUrl = rawShortUrl.startsWith("http") ? rawShortUrl : `https://${rawShortUrl}`;

    await adminDb().collection("personals").doc(personalId).update({ publicSlug: finalSlug, publicUrl });
    console.log("[slug/fix] 완료:", { finalSlug, publicUrl });

    return NextResponse.json({ success: true, publicUrl, slug: finalSlug });

  } catch (e) {
    console.error("[slug/fix] 예외:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
