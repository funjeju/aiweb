import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, where, limit, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "./client";

export interface StarComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPersonalId?: string;
  authorPublicSlug?: string;  // /p/[slug] or publicSlug 링크용
  authorNationality?: string; // ISO 3166-1 alpha-2, e.g. "KR"
  text: string;
  isPublic: boolean;
  createdAt: string;
}

const col = (starName: string) =>
  collection(db, "starComments", starName, "comments");

/** 공개 댓글만 — 타인 스페이스에서 별 클릭 시 */
export async function getPublicStarComments(starName: string, max = 30): Promise<StarComment[]> {
  const q = query(col(starName), where("isPublic", "==", true), orderBy("createdAt", "asc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<StarComment, "id" | "createdAt">),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }));
}

/** 전체 댓글 — 내 스페이스에서 내 별 클릭 시 */
export async function getStarComments(starName: string, max = 30): Promise<StarComment[]> {
  const q = query(col(starName), orderBy("createdAt", "asc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<StarComment, "id" | "createdAt">),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function addStarComment(
  starName: string,
  comment: Omit<StarComment, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(col(starName), { ...comment, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateStarCommentVisibility(
  starName: string,
  commentId: string,
  isPublic: boolean
): Promise<void> {
  await updateDoc(doc(db, "starComments", starName, "comments", commentId), { isPublic });
}

export async function deleteStarComment(starName: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, "starComments", starName, "comments", commentId));
}
