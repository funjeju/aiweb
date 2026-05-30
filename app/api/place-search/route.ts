import { NextRequest, NextResponse } from "next/server";
import { searchKakaoPlaces } from "@/lib/kakao/local";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { query, region } = await req.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ places: [] });
    }
    const places = await searchKakaoPlaces(query.trim(), region);
    return NextResponse.json({ places });
  } catch (err) {
    console.error("place-search error:", err);
    return NextResponse.json({ error: "Failed", places: [] }, { status: 500 });
  }
}
