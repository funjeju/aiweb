import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./client";

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: "public, max-age=31536000",
  });
  return getDownloadURL(snapshot.ref);
}

export async function uploadSiteImage(
  siteId: string,
  type: "hero" | "logo" | "gallery" | "menu",
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}.${ext}`;
  const path = `sites/${siteId}/${type}/${filename}`;
  return uploadImage(file, path);
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // 이미 없는 파일이면 무시
  }
}

export async function uploadPersonalImage(
  personalId: string,
  type: "photo" | "gallery" | "diary",
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}.${ext}`;
  const path = `personals/${personalId}/${type}/${filename}`;
  return uploadImage(file, path);
}

export async function uploadPersonalAudio(personalId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "mp3";
  const path = `personals/${personalId}/bgm/${Date.now()}.${ext}`;
  return uploadImage(file, path); // uploadBytes는 모든 파일에 동작함
}

export async function deletePersonalImage(url: string): Promise<void> {
  try {
    // Storage URL에서 path 추출 후 삭제
    const urlObj = new URL(url);
    const pathEncoded = urlObj.pathname.split("/o/")[1];
    if (!pathEncoded) return;
    const path = decodeURIComponent(pathEncoded.split("?")[0]);
    await deleteObject(ref(storage, path));
  } catch {
    // 무시
  }
}
