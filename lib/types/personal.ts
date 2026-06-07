import type { ThemeId } from "./site";

export type PersonaType = "portfolio" | "record" | "taste" | "couple" | "creator";

export interface PersonalProject {
  id: string;
  title: string;
  description: string;
  tags: string;
  link?: string;
  image?: string;
}

export interface PersonalSocials {
  github?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  email?: string;
}

/** 표시할 섹션 (원페이지 앵커 네비용). 순서 = 표시 순서 */
export type PersonalSection = "hero" | "about" | "skills" | "projects" | "contact";

export type UniverseIconType = "profile" | "diary" | "gallery" | "link" | "music" | "note";

export interface GalleryItem {
  url: string;
  caption?: string; // AI 생성 감성 캡션
  isPublic?: boolean; // 항목별 공개 여부 (기본 true). 사이트 비공개면 무시
}

/** AI 다이어리 감정 태그 */
export type DiaryEmotion =
  | "happy" | "calm" | "sad" | "excited"
  | "tired" | "grateful" | "anxious" | "neutral";

export interface DiaryEntry {
  id: string;
  date: string;            // YYYY-MM-DD
  mode: "text" | "chat";   // 일기형 / 대화형
  content: string;         // 최종 일기 본문 (대화형이면 AI 요약)
  emotion?: DiaryEmotion;  // AI 분류 감정
  isPublic: boolean;       // 항목별 공개 여부
  createdAt: string;       // ISO
  photos?: string[];       // 첨부 사진 URL 목록 (최대 3장)
}

export type SkyTheme = "deep-space" | "purple-galaxy" | "jeju" | "vintage";
export type LineStyle = "flow" | "dotted" | "aurora";
export type StarGlow = "default" | "soft" | "intense";

export interface UniverseStyle {
  skyTheme?: SkyTheme;
  lineStyle?: LineStyle;
  starGlow?: StarGlow;
}

export interface PersonalSchema {
  id: string;
  ownerId: string;
  /** Firestore 문서 내부용 ID 슬러그 (auto-generated) */
  slug: string;
  /** 중앙 Registry에서 할당된 공개 슬러그 (예: "funjeju") */
  publicSlug?: string;
  /** Registry 발급 공개 URL (예: "study.funjeju.co/funjeju") */
  publicUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;

  personaType: PersonaType;
  themeId: ThemeId;

  profile: {
    name: string;
    tagline: string;
    role: string;
    bio: string;
    photo?: string;
    heroImage?: string;
    socials: PersonalSocials;
  };

  about: string;
  skills: string[];
  projects: PersonalProject[];
  contact: {
    email?: string;
    phone?: string;
    message?: string;
  };

  sections: PersonalSection[];

  /** 별자리 우주 모드 (개인 웹의 메인 컨셉). 있으면 우주 홈으로 렌더 */
  universe?: {
    color: string;
    favoriteNumber: number;
    menus: Array<{ id: string; label: string; icon: UniverseIconType; customIcon?: string }>;
    style?: UniverseStyle;
    galleryImages?: string[];
    galleryItems?: GalleryItem[];
    diaryEntries?: DiaryEntry[];
    selectedAssets?: string[];
    /** 별자리 시드 — 최초 생성 시 한 번 저장, 이후 고정 */
    constellationSeed?: number;
    /** 즐겨찾기한 별자리 친구 목록 */
    savedConstellations?: Array<{
      id: string;
      name: string;
      color: string;
      constellationSeed?: number;
      savedAt: string;
    }>;
    /** 별자리 계절 — 스토리/정체성용 */
    constellationSeason?: "spring" | "summer" | "autumn" | "winter";
    /** 별자리 별 풀 — IP 기반 AI가 생성한 주극성 목록 */
    constellationStarPool?: Array<{ name: string; ra: number; dec: number; mag: number }>;
    /** BGM 설정 (단일, 구버전 호환용) */
    bgm?: {
      url: string;
      name: string;
      autoPlay?: boolean;
    };
    /** BGM 목록 (최대 3개) */
    bgmList?: Array<{
      url: string;
      name: string;
      autoPlay?: boolean;
    }>;
    /** 메뉴 노드 위치 — 데스크탑 */
    menuLayout?: Record<string, { top: string; left: string }>;
    /** 메뉴 노드 위치 — 모바일 (별도 저장) */
    menuLayoutMobile?: Record<string, { top: string; left: string }>;
    /** 에셋 위치 — 데스크탑 */
    assetPositions?: Record<string, { top: string; left: string }>;
    /** 에셋 위치 — 모바일 (별도 저장) */
    assetPositionsMobile?: Record<string, { top: string; left: string }>;
    /** 개인 업로드 커스텀 에셋 (PNG/WebP/GIF/SVG) */
    customAssets?: import("@/lib/types/asset").UniverseAsset[];
  };
}

export interface PersonaTypeDef {
  id: PersonaType;
  label: string;
  emoji: string;
  desc: string;
  sections: PersonalSection[];
}

// MVP: 포트폴리오형 우선, 나머지는 기본 섹션 세트 제공 (점진 확장)
export const PERSONA_TYPES: PersonaTypeDef[] = [
  { id: "portfolio", label: "포트폴리오", emoji: "💼", desc: "작업물·프로젝트 중심 (개발자·디자이너·창작자)", sections: ["hero", "about", "skills", "projects", "contact"] },
  { id: "record", label: "기록형", emoji: "📔", desc: "일상·생각을 기록하는 개인 공간", sections: ["hero", "about", "projects", "contact"] },
  { id: "taste", label: "취향 공유", emoji: "🎨", desc: "음악·영화·책 등 취향을 공유", sections: ["hero", "about", "projects", "contact"] },
  { id: "creator", label: "크리에이터", emoji: "🎬", desc: "콘텐츠·작품을 보여주는 창작자", sections: ["hero", "about", "skills", "projects", "contact"] },
];

export const SECTION_LABEL: Record<PersonalSection, string> = {
  hero: "Home",
  about: "About",
  skills: "Skills",
  projects: "Projects",
  contact: "Contact",
};
