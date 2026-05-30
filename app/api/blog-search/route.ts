import { NextRequest, NextResponse } from "next/server";
import { searchNaverBlog, isNaverConfigured } from "@/lib/naver/blog";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ posts: [], configured: isNaverConfigured() });
    const posts = await searchNaverBlog(query.trim());
    return NextResponse.json({ posts, configured: isNaverConfigured() });
  } catch (err) {
    console.error("blog-search error:", err);
    return NextResponse.json({ error: "Failed", posts: [] }, { status: 500 });
  }
}
