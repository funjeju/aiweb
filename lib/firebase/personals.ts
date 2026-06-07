import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, serverTimestamp, limit,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./client";
import type { PersonalSchema } from "@/lib/types/personal";

const COLLECTION = "personals";

export async function getPersonalById(id: string): Promise<PersonalSchema | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? (snap.data() as PersonalSchema) : null;
}

export async function getPersonalsByOwner(ownerId: string): Promise<PersonalSchema[]> {
  const q = query(collection(db, COLLECTION), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PersonalSchema);
}

export async function createPersonal(p: PersonalSchema): Promise<void> {
  // Firestore는 undefined 값을 저장하지 못하므로 직렬화로 제거한다.
  const clean = JSON.parse(JSON.stringify(p));
  await setDoc(doc(db, COLLECTION, p.id), { ...clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updatePersonal(id: string, data: Partial<PersonalSchema>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePersonal(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** published된 별자리 우주 목록 (랜덤 이웃 구경용). 클라이언트 필터로 universe 보유 여부 확인. */
export async function getPublishedUniverses(maxCount = 30): Promise<PersonalSchema[]> {
  const q = query(collection(db, COLLECTION), where("published", "==", true), limit(maxCount));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as PersonalSchema)
    .filter((p) => !!p.universe?.color);
}

/**
 * 별자리 생성 시 stars 컬렉션에 별 → 유저 매핑 등록.
 * stars/{starName} = { users: [{ personalId, name, color }] }
 */
export async function registerStarUsers(
  starNames: string[],
  personalId: string,
  name: string,
  color: string,
): Promise<void> {
  const entry = { personalId, name, color };
  await Promise.all(
    starNames.map((starName) =>
      setDoc(
        doc(db, "stars", starName),
        { users: arrayUnion(entry) },
        { merge: true },
      )
    )
  );
}

/** 특정 별을 가진 유저 목록 조회 (자신 제외, 최대 count명 랜덤) */
export async function getStarNeighbors(
  starName: string,
  excludePersonalId: string,
  count = 3,
): Promise<Array<{ personalId: string; name: string; color: string }>> {
  const snap = await getDoc(doc(db, "stars", starName));
  if (!snap.exists()) return [];
  const users: Array<{ personalId: string; name: string; color: string }> =
    (snap.data().users ?? []).filter((u: { personalId: string }) => u.personalId !== excludePersonalId);
  // 랜덤 셔플 후 count개 반환
  for (let i = users.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [users[i], users[j]] = [users[j], users[i]];
  }
  return users.slice(0, count);
}

/** 커스텀 에셋 배열을 Firestore에 저장 */
export async function saveCustomAssets(
  personalId: string,
  assets: import("@/lib/types/asset").UniverseAsset[],
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, personalId), {
    "universe.customAssets": assets,
    updatedAt: serverTimestamp(),
  });
}

/** 전체 개인 페이지 조회 (어드민 전용) */
export async function getAllPersonals(maxCount = 200): Promise<PersonalSchema[]> {
  const q = query(collection(db, COLLECTION), limit(maxCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PersonalSchema);
}
