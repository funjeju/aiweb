import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

/** 우주 전역 설정 (어드민이 관리, 모든 별자리에 적용) */
export interface UniverseGlobalConfig {
  /** 별똥별 발사 주기 (초) */
  shootingStarIntervalSec: number;
  /** 워프 효과음 URL (null 또는 "builtin:xxx"이면 Web Audio 생성음) */
  warpSoundUrl?: string | null;
}

export const DEFAULT_UNIVERSE_CONFIG: UniverseGlobalConfig = {
  shootingStarIntervalSec: 10,
  warpSoundUrl: null,
};

const CONFIG_COL = "config";
const CONFIG_DOC = "universe";

/** 클라이언트에서 전역 설정 조회 */
export async function getUniverseConfig(): Promise<UniverseGlobalConfig> {
  try {
    const snap = await getDoc(doc(db, CONFIG_COL, CONFIG_DOC));
    if (snap.exists()) return { ...DEFAULT_UNIVERSE_CONFIG, ...(snap.data() as Partial<UniverseGlobalConfig>) };
  } catch { /* 기본값 폴백 */ }
  return DEFAULT_UNIVERSE_CONFIG;
}

/** 어드민 — 전역 설정 저장 */
export async function setUniverseConfig(cfg: Partial<UniverseGlobalConfig>): Promise<void> {
  await setDoc(doc(db, CONFIG_COL, CONFIG_DOC), { ...cfg, updatedAt: serverTimestamp() }, { merge: true });
}
