import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { getPersonalById } from "@/lib/firebase/personals";
import type { PersonalSchema } from "@/lib/types/personal";
import { PersonalSite } from "@/components/personal/PersonalSite";

export const runtime = "nodejs";
export const revalidate = 3600;

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
  return <PersonalSite data={p} />;
}
