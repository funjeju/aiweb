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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const slugDomain = process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "study.funjeju.com";
    const targetUrl = `${appUrl}/p/${personalId}`;

    // 서버사이드에서 호출 → CORS 없음
    const result = await registerSlug({ slug, target_url: targetUrl });

    if (result.success) {
      // Firestore에 publicSlug, publicUrl 업데이트
      const newPublicUrl = result.short_url || `https://${slugDomain}/${result.final_slug}`;
      await adminDb().collection("personals").doc(personalId).update({
        publicSlug: result.final_slug,
        publicUrl: newPublicUrl,
      });
      return NextResponse.json({ success: true, publicUrl: newPublicUrl, slug: result.final_slug });
    }

    return NextResponse.json({ success: false, error: result.error ?? "등록 실패" });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
