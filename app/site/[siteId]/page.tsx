import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { getSiteById } from "@/lib/firebase/sites";
import type { SiteSchema } from "@/lib/types/site";
import { PublicSite } from "@/components/PublicSite";

export const runtime = "nodejs";

interface Props {
  params: Promise<{ siteId: string }>;
}

/**
 * Firestore 데이터를 클라이언트 컴포넌트로 넘길 수 있는 순수 객체로 직렬화한다.
 * Timestamp 등 클래스 인스턴스를 제거 (서버→클라이언트 전달 제약).
 */
function toPlain<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

async function getSite(siteId: string): Promise<SiteSchema | null> {
  // 1) Firebase Admin 우선 (SSR)
  try {
    const snap = await adminDb().collection("sites").doc(siteId).get();
    if (snap.exists) return toPlain<SiteSchema>(snap.data());
  } catch (e) {
    console.error("[site] admin read failed, falling back to client SDK:", e);
  }
  // 2) Admin 실패 시 클라이언트 SDK로 폴백 (환경변수/키 문제에도 사이트가 열리도록)
  try {
    const site = await getSiteById(siteId);
    return site ? toPlain<SiteSchema>(site) : null;
  } catch (e) {
    console.error("[site] client read failed:", e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteId } = await params;
  const site = await getSite(siteId);
  if (!site) return { title: "Not Found" };

  return {
    title: site.merchantInfo.name,
    description: site.merchantInfo.description,
    openGraph: {
      title: site.merchantInfo.name,
      description: site.merchantInfo.description,
      images: site.contentAssets.heroImage ? [site.contentAssets.heroImage] : [],
    },
  };
}

export default async function SitePage({ params }: Props) {
  const { siteId } = await params;
  const site = await getSite(siteId);
  if (!site) notFound();

  return <PublicSite site={site} />;
}
