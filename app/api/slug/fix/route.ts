import { NextRequest, NextResponse } from "next/server";
import { registerSlug } from "@/lib/slug-registry";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { slug, personalId } = await req.json();
    if (!slug || !personalId) {
      return NextResponse.json({ success: false, error: "slug, personalId 필요" }, { status: 400 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const slugDomain = process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "study.funjeju.com";
    const targetUrl = `${appUrl}/p/${personalId}`;
    // 레지스트리 없어도 항상 유효한 직접 URL
    const directUrl = targetUrl;

    let publicUrl = directUrl;
    let publicSlug = slug;

    // 레지스트리 등록 시도 (실패해도 직접 URL로 폴백)
    try {
      const result = await registerSlug({ slug, target_url: targetUrl });
      if (result.success && result.short_url) {
        const shortUrl = result.short_url.startsWith("http")
          ? result.short_url
          : `https://${result.short_url}`;
        publicUrl = shortUrl;
        publicSlug = result.final_slug;
      } else if (result.success) {
        publicUrl = `https://${slugDomain}/${result.final_slug}`;
        publicSlug = result.final_slug;
      }
    } catch {
      // 레지스트리 연결 실패 → 직접 URL 사용
    }

    // Firestore 업데이트 (레지스트리 성공 여부 무관)
    await adminDb().collection("personals").doc(personalId).update({
      publicSlug,
      publicUrl,
    });

    return NextResponse.json({ success: true, publicUrl, slug: publicSlug });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
