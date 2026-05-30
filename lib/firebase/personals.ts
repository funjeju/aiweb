import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, serverTimestamp,
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
  await setDoc(doc(db, COLLECTION, p.id), { ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updatePersonal(id: string, data: Partial<PersonalSchema>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePersonal(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
