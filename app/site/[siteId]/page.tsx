import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import type { SiteSchema } from "@/lib/types/site";
import { PublicSite } from "@/components/PublicSite";

interface Props {
  params: Promise<{ siteId: string }>;
}

async function getSite(siteId: string): Promise<SiteSchema | null> {
  try {
    const snap = await adminDb().collection("sites").doc(siteId).get();
    if (!snap.exists) return null;
    return snap.data() as SiteSchema;
  } catch {
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
