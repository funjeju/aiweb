import {
  collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";
import type { UniverseAsset } from "@/lib/types/asset";
import { DEFAULT_ASSETS } from "@/lib/types/asset";

const COL = "universe_assets";

/** 커스텀 에셋(어드민 추가) 목록 조회 */
export async function getCustomAssets(): Promise<UniverseAsset[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => d.data() as UniverseAsset);
}

/** 기본 + 커스텀 에셋 전체 목록 */
export async function getAllAssets(): Promise<UniverseAsset[]> {
  const custom = await getCustomAssets();
  return [...DEFAULT_ASSETS, ...custom];
}

/** 어드민 — 커스텀 에셋 추가/수정 */
export async function saveCustomAsset(asset: Omit<UniverseAsset, "isDefault" | "createdAt">): Promise<void> {
  const data: UniverseAsset = {
    ...asset,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COL, asset.id), { ...data, updatedAt: serverTimestamp() });
}

/** 어드민 — 커스텀 에셋 삭제 */
export async function deleteCustomAsset(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

/** 어드민 — 에셋 무료/유료 토글 */
export async function toggleAssetFree(id: string, isFree: boolean): Promise<void> {
  // 기본 에셋은 Firestore에 없으므로 커스텀만 처리
  await setDoc(doc(db, COL, id), { isFree, updatedAt: serverTimestamp() }, { merge: true });
}
