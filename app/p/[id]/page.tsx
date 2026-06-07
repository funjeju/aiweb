import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { getPersonalById } from "@/lib/firebase/personals";
import type { PersonalSchema, GalleryItem } from "@/lib/types/personal";
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
  // 비공개 사이트는 메타데이터에 내용 노출 금지
  if (p.published === false) {
    return { title: `${p.profile.name}님의 우주`, robots: { index: false, follow: false } };
  }
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
    // 전역 설정 (별똥별 주기 등) — 어드민이 관리
    let shootingStarIntervalSec = 10;
    try {
      const cfgSnap = await adminDb().collection("config").doc("universe").get();
      if (cfgSnap.exists) shootingStarIntervalSec = cfgSnap.data()?.shootingStarIntervalSec ?? 10;
    } catch { /* 기본값 */ }

    const isPrivate = p.published === false;

    // bgm(구버전 단일) → bgmList 마이그레이션
    const bgmList = p.universe.bgmList
      ?? (p.universe.bgm ? [p.universe.bgm] : []);

    // ── 공개 콘텐츠만 SSR 전송 (비소유자 소스 노출 방지) ──
    // 비공개 사이트: 별자리 렌더 최소 정보만. 공개 사이트: 공개 항목만.
    const allGallery: GalleryItem[] = p.universe.galleryItems
      ?? (p.universe.galleryImages ?? []).map((url) => ({ url }));
    const publicGallery = isPrivate ? [] : allGallery.filter((it) => it.isPublic !== false);
    const publicDiary   = isPrivate ? [] : (p.universe.diaryEntries ?? []).filter((e) => e.isPublic);

    // publicUrl 폴백: publicSlug로 구성, 없으면 직접 URL
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
      // 프로필/소개는 공개 사이트에서만 SSR 전송. 비공개면 소유자가 클라이언트에서 로드.
      about:    isPrivate ? "" : (p.about || p.profile.bio),
      photo:    isPrivate ? undefined : p.profile.photo,
      tagline:  isPrivate ? "" : p.profile.tagline,
      role:     isPrivate ? "" : p.profile.role,
      socials:  isPrivate ? {} : p.profile.socials,
      style: p.universe.style,
      galleryItems: publicGallery,
      diaryEntries: publicDiary,
      published: p.published,
      shootingStarIntervalSec,
      publicUrl: publicUrl ?? undefined,
      ownerId: p.ownerId,
      personalId: p.id,
      selectedAssets: p.universe.selectedAssets,
      bgmList,
      bgmShuffle: p.universe.bgmShuffle,
      menuLayout: p.universe.menuLayout,
      menuLayoutMobile: p.universe.menuLayoutMobile,
      assetPositions: p.universe.assetPositions,
      assetPositionsMobile: p.universe.assetPositionsMobile,
      customAssets: p.universe.customAssets,
      starArchive: p.starArchive,
      favorites: p.universe.favorites,
      country: p.country,
      countryChangedAt: p.countryChangedAt,
      isAdmin: p.profile?.role === "admin",
    };

    return (
      <Suspense fallback={<div className="w-full h-screen bg-[#05060f]" />}>
        <UniverseHome data={universeData} />
      </Suspense>
    );
  }

  return <PersonalSite data={p} />;
}
