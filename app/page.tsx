import { Suspense } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { UniverseExplore } from "@/components/universe/UniverseExplore";
import type { UniverseItem } from "@/components/universe/UniverseExplore";

export const runtime = "nodejs";
export const revalidate = 60; // 1분마다 갱신

async function getPublishedUniverses(): Promise<UniverseItem[]> {
  try {
    const snap = await adminDb()
      .collection("personals")
      .where("published", "==", true)
      .limit(100)
      .get();

    return snap.docs
      .filter((d) => !!d.data().universe)
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: (data.profile?.name as string) || "익명",
          color: (data.universe?.color as string) || "#a78bfa",
          favoriteNumber: (data.universe?.favoriteNumber as number) || 7,
          constellationSeed: data.universe?.constellationSeed as number | undefined,
          tagline: data.profile?.tagline as string | undefined,
          role: data.profile?.role as string | undefined,
        };
      });
  } catch {
    return [];
  }
}

export default async function MainPage() {
  const universes = await getPublishedUniverses();

  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#04050d]" />}>
      <UniverseExplore universes={universes} />
    </Suspense>
  );
}
