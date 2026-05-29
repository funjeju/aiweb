import { NextRequest, NextResponse } from "next/server";
import { analyzeImageJSON } from "@/lib/ai/gemini";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const LIVE_FEED_PROMPT = `
너는 소상공인 가게 사진을 분석하는 운영 AI다.

사진을 보고 다음을 판단하라:
1. 콘텐츠 유형 (신메뉴, 분위기/뷰, 이벤트, 공간/인테리어, 기타)
2. 추천 제목 (20자 이내, 한국어)
3. 추천 카피 (50자 이내, 소셜 미디어용)
4. 웹사이트 반영 위치 추천 (hero, featured, gallery, announcement)

반환 형식 (JSON):
{
  "type": "menu|view|event|space|other",
  "title": "...",
  "caption": "...",
  "suggestedSection": "hero|featured|gallery|announcement",
  "confidence": 0.0~1.0
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const siteId = formData.get("siteId") as string | null;

    if (!file || !siteId) {
      return NextResponse.json({ error: "file and siteId required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const analysis = await analyzeImageJSON<{
      type: string;
      title: string;
      caption: string;
      suggestedSection: string;
      confidence: number;
    }>(LIVE_FEED_PROMPT, base64, mimeType);

    // Firestore에 피드 항목 저장
    const feedItem = {
      siteId,
      type: analysis.type,
      title: analysis.title,
      caption: analysis.caption,
      suggestedSection: analysis.suggestedSection,
      confidence: analysis.confidence,
      createdAt: new Date().toISOString(),
      applied: false,
    };

    const ref = await adminDb().collection("live-feeds").add(feedItem);

    return NextResponse.json({ feedId: ref.id, analysis });
  } catch (err) {
    console.error("Live feed error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  try {
    const snap = await adminDb()
      .collection("live-feeds")
      .where("siteId", "==", siteId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const feeds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ feeds });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
