import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./client";
import type { SiteSchema } from "@/lib/types/site";

const SITES_COLLECTION = "sites";

export async function getSiteById(siteId: string): Promise<SiteSchema | null> {
  const ref = doc(db, SITES_COLLECTION, siteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as SiteSchema;
}

export async function getSiteBySubdomain(subdomain: string): Promise<SiteSchema | null> {
  const q = query(
    collection(db, SITES_COLLECTION),
    where("subdomain", "==", subdomain),
    where("published", "==", true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as SiteSchema;
}

export async function getSitesByOwner(ownerId: string): Promise<SiteSchema[]> {
  const q = query(collection(db, SITES_COLLECTION), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SiteSchema);
}

export async function createSite(site: SiteSchema): Promise<void> {
  const ref = doc(db, SITES_COLLECTION, site.siteId);
  await setDoc(ref, { ...site, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateSite(siteId: string, data: Partial<SiteSchema>): Promise<void> {
  const ref = doc(db, SITES_COLLECTION, siteId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSite(siteId: string): Promise<void> {
  await deleteDoc(doc(db, SITES_COLLECTION, siteId));
}

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const q = query(collection(db, SITES_COLLECTION), where("subdomain", "==", subdomain));
  const snap = await getDocs(q);
  return snap.empty;
}
