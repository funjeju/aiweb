import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { getSiteById } from "@/lib/firebase/sites";
import type { SiteSchema } from "@/lib/types/site";
import { PublicSite } from "@/components/PublicSite";
import { buildLocalBusinessJsonLd } from "@/lib/seo/jsonld";
import { getAppUrl } from "@/lib/utils";

export const runtime = "nodejs";
// ISR: 1시간마다 재생성 (속도·비용 개선, Core Web Vitals)
export const revalidate = 3600;

interface Props {
  params: Promise<{ siteId: string }>;
}

function toPlain<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

// React cache로 감싸 generateMetadata와 page에서 중복 호출돼도 1회만 실행
const getSite = cache(async (siteId: string): Promise<SiteSchema | null> => {
  try {
    const snap = await adminDb().collection("sites").doc(siteId).get();
    if (snap.exists) return toPlain<SiteSchema>(snap.data());
  } catch (e) {
    console.error("[site] admin read failed, falling back to client SDK:", e);
  }
  try {
    const site = await getSiteById(siteId);
    return site ? toPlain<SiteSchema>(site) : null;
  } catch (e) {
    console.error("[site] client read failed:", e);
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteId } = await params;
  const site = await getSite(siteId);
  if (!site) return { title: "Not Found" };

  const m = site.merchantInfo;
  const url = `${getAppUrl()}/site/${siteId}`;
  const title = m.category ? `${m.name} | ${m.category}` : m.name;
  const description = m.description || `${m.name}${m.address ? ` · ${m.address}` : ""}`;
  const images = site.contentAssets.heroImage ? [site.contentAssets.heroImage] : [];

  return {
    title,
    description,
    keywords: [m.name, m.category, m.address?.split(" ").slice(0, 2).join(" ")].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url,
      title,
      description,
      siteName: m.name,
      images,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function SitePage({ params }: Props) {
  const { siteId } = await params;
  const site = await getSite(siteId);
  if (!site) notFound();

  const url = `${getAppUrl()}/site/${siteId}`;
  const jsonLd = buildLocalBusinessJsonLd(site, url);

  return (
    <>
      {/* 구조화 데이터 (구글 로컬 검색/지도 리치결과) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicSite site={site} />
    </>
  );
}
