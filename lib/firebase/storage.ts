import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./client";

/**
 * 이미지를 최대 width/height 안으로 리사이징 후 Blob 반환.
 * 원본이 이미 작으면 그대로 반환. JPEG quality 0.85.
 */
async function resizeImage(file: File, maxSize = 1200): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width <= maxSize && height <= maxSize) {
        resolve(file);
        return;
      }
      const ratio = Math.min(maxSize / width, maxSize / height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

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
  // 이미지 타입만 리사이징 (오디오 등 다른 파일 제외)
  const isImage = file.type.startsWith("image/");
  const blob = isImage ? await resizeImage(file, type === "photo" ? 800 : 1200) : file;
  const ext = isImage ? "jpg" : (file.name.split(".").pop() || "jpg");
  const filename = `${Date.now()}.${ext}`;
  const path = `personals/${personalId}/${type}/${filename}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob, {
    contentType: isImage ? "image/jpeg" : file.type,
    cacheControl: "public, max-age=31536000",
  });
  return getDownloadURL(snapshot.ref);
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
