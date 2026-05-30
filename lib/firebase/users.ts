import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

export type UserRole = "admin" | "agency" | "owner" | "guest";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  /** 관리자가 홈페이지 생성/관리 권한을 승인했는지 */
  approved: boolean;
  createdAt?: unknown;
}

const USERS = "users";

/** 로그인 사용자 프로필을 가져온다. 없으면 기본(guest, 미승인)으로 생성. */
export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<UserProfile> {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  const profile: UserProfile = {
    uid,
    email,
    displayName: displayName || "",
    role: "guest",
    approved: false,
  };
  await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** 홈페이지를 만들고 관리할 수 있는 권한이 있는가. */
export function canManageSites(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return profile.approved && (profile.role === "agency" || profile.role === "owner");
}
