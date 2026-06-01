import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";

export interface StarComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPersonalId?: string;
  text: string;
  createdAt: string;
}

const col = (starName: string) =>
  collection(db, "starComments", starName, "comments");

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

export async function deleteStarComment(starName: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, "starComments", starName, "comments", commentId));
}
