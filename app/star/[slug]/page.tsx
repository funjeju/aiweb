import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStarArchive, getAllStarSlugs } from "@/lib/data/star-archive";
import { StarArchivePage } from "@/components/star/StarArchivePage";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllStarSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const star = getStarArchive(slug);
  if (!star) return { title: "Star Not Found" };
  return {
    title: `${star.nameEn} — ${star.shortDesc.en}`,
    description: star.longDesc.en.slice(0, 160),
    openGraph: {
      title: `${star.nameEn} (${star.nameKo}) | Star Archive`,
      description: star.shortDesc.en,
      type: "article",
    },
    alternates: {
      canonical: `/star/${slug}`,
    },
  };
}

export default async function StarPage({ params }: Props) {
  const { slug } = await params;
  const star = getStarArchive(slug);
  if (!star) notFound();
  return <StarArchivePage star={star} />;
}
