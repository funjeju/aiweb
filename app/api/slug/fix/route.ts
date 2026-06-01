import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // NEXT_PUBLIC_SLUG_REGISTRY_URL = 전체 create 엔드포인트
  const REGISTRY_CREATE_URL = (process.env.NEXT_PUBLIC_SLUG_REGISTRY_URL ?? "").replace(/\/$/, "");
  const REGISTRY_KEY        = process.env.NEXT_PUBLIC_SLUG_REGISTRY_KEY ?? "";
  // NEXT_PUBLIC_SLUG_DOMAIN = 베이스 도메인 (https 포함)
  const SLUG_DOMAIN         = (process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "https://study.funjeju.com").replace(/\/$/, "");
  // NEXT_PUBLIC_APP_URL 없으면 Vercel 자동 제공 VERCEL_URL 폴백
  const APP_URL = (
    process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  ).replace(/\/$/, "");

  console.log("[slug/fix] ENV CHECK:", {
    REGISTRY_CREATE_URL: REGISTRY_CREATE_URL || "(비어있음)",
    REGISTRY_KEY:        REGISTRY_KEY ? "설정됨" : "(비어있음)",
    SLUG_DOMAIN,
    APP_URL: APP_URL || "(비어있음)",
  });

  try {
    const { slug, personalId } = await req.json();
    if (!slug || !personalId) {
      return NextResponse.json({ success: false, error: "slug, personalId 필요" }, { status: 400 });
    }

    const targetUrl = `${APP_URL}/p/${personalId}`;
    console.log("[slug/fix] 요청:", { slug, personalId, targetUrl });

    let registrySucceeded = false;
    let publicUrl = targetUrl;
    let publicSlug = slug;

    if (REGISTRY_CREATE_URL) {
      console.log("[slug/fix] 레지스트리 호출:", REGISTRY_CREATE_URL);
      try {
        const registryRes = await fetch(REGISTRY_CREATE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(REGISTRY_KEY ? { "x-api-key": REGISTRY_KEY } : {}),
          },
          body: JSON.stringify({ target_url: targetUrl, preferred_slug: slug }),
        });
        const registryText = await registryRes.text();
        console.log("[slug/fix] 레지스트리 응답:", registryRes.status, registryText);

        if (registryRes.ok) {
          let parsed: Record<string, unknown> = {};
          try { parsed = JSON.parse(registryText); } catch { /* ignore */ }
          const finalSlug = (parsed.final_slug ?? parsed.slug ?? slug) as string;
          const rawShortUrl = (parsed.short_url ?? parsed.url ?? `${SLUG_DOMAIN}/${finalSlug}`) as string;
          publicUrl = rawShortUrl.startsWith("http") ? rawShortUrl : `https://${rawShortUrl}`;
          publicSlug = finalSlug;
          registrySucceeded = true;
          console.log("[slug/fix] 레지스트리 성공:", { publicUrl, publicSlug });
        } else {
          console.warn("[slug/fix] 레지스트리 HTTP 실패:", registryRes.status, "→ 직접 URL 사용");
        }
      } catch (fetchErr) {
        console.error("[slug/fix] 레지스트리 연결 실패:", fetchErr, "→ 직접 URL 사용");
      }
    } else {
      console.warn("[slug/fix] REGISTRY_CREATE_URL 미설정 → 직접 URL 사용");
    }

    // 레지스트리 성공 여부 무관하게 Firestore 업데이트
    await adminDb().collection("personals").doc(personalId).update({ publicSlug, publicUrl });
    console.log("[slug/fix] Firestore 완료:", { publicSlug, publicUrl, registrySucceeded });

    return NextResponse.json({
      success: true,
      publicUrl,
      slug: publicSlug,
      registrySucceeded,
      note: registrySucceeded
        ? "레지스트리 단축 URL 발급 완료"
        : "레지스트리 연결 불가 — 직접 URL로 저장됨",
    });

  } catch (e) {
    console.error("[slug/fix] 예외:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
