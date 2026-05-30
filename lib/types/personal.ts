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

export interface PersonalSchema {
  id: string;
  ownerId: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;

  personaType: PersonaType;
  themeId: ThemeId;

  profile: {
    name: string;
    tagline: string; // 한 줄 소개 (예: 프론트엔드 개발자 | 웹을 통해 가치를 만드는 사람)
    role: string;
    bio: string; // 자기소개 문단
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
