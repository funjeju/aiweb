import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./client";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    // 팝업 방식 우선 시도
    return await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    // COOP 또는 팝업 차단 오류 → redirect 방식으로 fallback
    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(auth, googleProvider);
      // redirect 후 페이지가 이동하므로 여기에 도달하지 않음
      return {} as UserCredential;
    }
    throw err;
  }
}

export const getGoogleRedirectResult = () => getRedirectResult(auth);

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const onAuth = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);
