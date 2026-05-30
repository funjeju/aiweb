import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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
const ADMIN_EMAILS = ["naggu1999@gmail.com"];

/** 로그인 사용자 프로필을 가져온다. 없으면 기본(guest, 미승인)으로 생성. */
export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<UserProfile> {
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const profile = snap.data() as UserProfile;
    // 관리자 이메일인데 role이 admin이 아니면 승격
    if (isAdmin && profile.role !== "admin") {
      await updateDoc(ref, { role: "admin", approved: true });
      return { ...profile, role: "admin", approved: true };
    }
    return profile;
  }

  const profile: UserProfile = {
    uid,
    email,
    displayName: displayName || "",
    role: isAdmin ? "admin" : "guest",
    approved: isAdmin,
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
