/**
 * 네이버 검색 API (블로그) — 가게명으로 블로그 후기 글을 가져온다.
 * 본문/임베드는 불가, 제목/요약/링크/작성일/블로거명까지만 (공식 API 제약).
 * 서버사이드 전용 (Client ID/Secret 사용).
 */

export interface NaverBlogPost {
  title: string; // HTML 태그 제거된 제목
  link: string;
  description: string; // 요약
  bloggername: string;
  postdate: string; // YYYYMMDD
}

interface NaverBlogItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string;
}

/** 네이버 검색 결과의 <b> 등 HTML 태그/엔티티 제거 */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .trim();
}

export function isNaverConfigured(): boolean {
  return !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

export async function searchNaverBlog(query: string, display = 6): Promise<NaverBlogPost[]> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    console.warn("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET not set — 네이버 블로그 검색 비활성");
    return [];
  }

  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`;
  try {
    const res = await fetch(url, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
    });
    if (!res.ok) {
      console.error("naver blog api error:", res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as { items: NaverBlogItem[] };
    return (data.items ?? []).map((item) => ({
      title: stripHtml(item.title),
      link: item.link,
      description: stripHtml(item.description),
      bloggername: item.bloggername,
      postdate: item.postdate,
    }));
  } catch (err) {
    console.error("naver blog search failed:", err);
    return [];
  }
}
