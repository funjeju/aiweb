export type AssetAnimationType = "float" | "drift" | "orbit" | "pulse";
export type AssetCategory = "character" | "object" | "effect";

export interface UniverseAsset {
  id: string;
  name: string;
  emoji: string;
  category: AssetCategory;
  animationType: AssetAnimationType;
  isFree: boolean;
  isDefault: boolean; // true = 코드에 내장된 기본 에셋 (Firestore 저장 불필요)
  createdAt?: string;
}

/** 프로필 사진 특수 에셋 — 이미지 URL로 렌더링됨 */
export const PROFILE_PHOTO_ASSET: UniverseAsset = {
  id: "profile-photo",
  name: "프로필 사진",
  emoji: "🖼️",
  category: "character",
  animationType: "float",
  isFree: true,
  isDefault: true,
};

/** 기본 무료 에셋 (코드 내장) */
export const DEFAULT_ASSETS: UniverseAsset[] = [
  { id: "astronaut", name: "우주인",   emoji: "👨‍🚀", category: "character", animationType: "float",  isFree: true, isDefault: true },
  { id: "rocket",    name: "우주선",   emoji: "🚀",   category: "object",    animationType: "drift",  isFree: true, isDefault: true },
  { id: "ufo",       name: "UFO",      emoji: "🛸",   category: "object",    animationType: "orbit",  isFree: true, isDefault: true },
  { id: "moon",      name: "달",       emoji: "🌙",   category: "object",    animationType: "float",  isFree: true, isDefault: true },
  { id: "planet",    name: "행성",     emoji: "🪐",   category: "object",    animationType: "float",  isFree: true, isDefault: true },
  { id: "comet",     name: "혜성",     emoji: "☄️",  category: "effect",    animationType: "drift",  isFree: true, isDefault: true },
  { id: "satellite", name: "인공위성", emoji: "🛰️", category: "object",    animationType: "orbit",  isFree: true, isDefault: true },
  { id: "alien",     name: "외계인",   emoji: "👽",   category: "character", animationType: "pulse",  isFree: true, isDefault: true },
  { id: "star4",     name: "빛나는 별", emoji: "✨",  category: "effect",    animationType: "pulse",  isFree: true, isDefault: true },
  { id: "galaxy",    name: "성운",     emoji: "🌌",   category: "effect",    animationType: "float",  isFree: true, isDefault: true },
];
