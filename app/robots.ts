import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 편집/관리/인증/API 경로는 크롤링 제외
        disallow: ["/editor/", "/dashboard", "/login", "/signup", "/create", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
