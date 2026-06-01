import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { getPersonalById } from "@/lib/firebase/personals";
import type { PersonalSchema } from "@/lib/types/personal";
import { PersonalSite } from "@/components/personal/PersonalSite";
import { UniverseHome } from "@/components/universe/UniverseHome";

export const runtime = "nodejs";
export const revalidate = 30;

interface Props { params: Promise<{ id: string }>; }

function toPlain<T>(d: unknown): T { return JSON.parse(JSON.stringify(d)) as T; }

const getPersonal = cache(async (id: string): Promise<PersonalSchema | null> => {
  try {
    const snap = await adminDb().collection("personals").doc(id).get();
    if (snap.exists) return toPlain<PersonalSchema>(snap.data());
  } catch {
    /* fall through */
  }
  try {
    const p = await getPersonalById(id);
    return p ? toPlain<PersonalSchema>(p) : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPersonal(id);
  if (!p) return { title: "Not Found" };
  const title = p.profile.name + (p.profile.role ? ` · ${p.profile.role}` : "");
  return {
    title,
    description: p.profile.tagline || p.profile.bio,
    openGraph: { title, description: p.profile.tagline, images: p.profile.heroImage ? [p.profile.heroImage] : [] },
  };
}

export default async function PersonalPage({ params }: Props) {
  const { id } = await params;
  const p = await getPersonal(id);
  if (!p) notFound();

  // 별자리 우주 모드면 우주 홈으로 렌더 (개인 웹 메인 컨셉)
  if (p.universe) {
    // legacyImages → GalleryItem 변환 (마이그레이션)
    const galleryItems = p.universe.galleryItems
      ?? (p.universe.galleryImages ?? []).map((url) => ({ url }));

    // bgm(구버전 단일) → bgmList 마이그레이션
    const bgmList = p.universe.bgmList
      ?? (p.universe.bgm ? [p.universe.bgm] : []);

    // publicUrl 폴백: publicSlug로 구성, 없으면 직접 URL
    // NEXT_PUBLIC_SLUG_DOMAIN 이 https:// 포함할 수도 있으므로 중복 방지
    const slugBase = (process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "https://study.funjeju.com").replace(/\/$/, "");
    const appUrl   = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const publicUrl = p.publicUrl
      || (p.publicSlug ? `${slugBase}/${p.publicSlug}` : null)
      || (appUrl ? `${appUrl}/p/${p.id}` : null)
      || null;

    const universeData = {
      name: p.profile.name,
      color: p.universe.color ?? "#a78bfa",
      favoriteNumber: p.universe.favoriteNumber ?? 7,
      constellationSeed: p.universe.constellationSeed,
      menus: p.universe.menus ?? [],
      about: p.about || p.profile.bio,
      style: p.universe.style,
      photo: p.profile.photo,
      tagline: p.profile.tagline,
      role: p.profile.role,
      socials: p.profile.socials,
      galleryItems,
      publicUrl: publicUrl ?? undefined,
      ownerId: p.ownerId,
      personalId: p.id,
      selectedAssets: p.universe.selectedAssets,
      bgmList,
      menuLayout: p.universe.menuLayout,
      menuLayoutMobile: p.universe.menuLayoutMobile,
      assetPositions: p.universe.assetPositions,
      assetPositionsMobile: p.universe.assetPositionsMobile,
    };

    return (
      <Suspense fallback={<div className="w-full h-screen bg-[#05060f]" />}>
        <UniverseHome data={universeData} />
      </Suspense>
    );
  }

  return <PersonalSite data={p} />;
}
