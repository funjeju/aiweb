import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { getAppUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/admin`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // 공개된 사이트들을 sitemap에 포함 (서버에서 admin SDK로 직접 조회)
  try {
    const snap = await adminDb()
      .collection("sites")
      .where("published", "==", true)
      .get();

    const siteRoutes: MetadataRoute.Sitemap = snap.docs.map((d) => {
      const data = d.data();
      const updated = data.updatedAt?.toDate?.() ?? new Date();
      return {
        url: `${base}/${d.id}`,
        lastModified: updated,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });
    return [...staticRoutes, ...siteRoutes];
  } catch (e) {
    console.error("[sitemap] failed to load published sites:", e);
    return staticRoutes;
  }
}
