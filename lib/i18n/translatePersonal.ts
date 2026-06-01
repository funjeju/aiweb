import type { PersonalSchema } from "@/lib/types/personal";

/**
 * PersonalSchema에서 번역 대상 텍스트를 순서대로 추출.
 * 이름/URL/이메일/전화는 제외.
 */
export function collectPersonalTexts(data: PersonalSchema): string[] {
  const out: string[] = [];
  const push = (s?: string) => out.push(s ?? "");

  push(data.profile.tagline);
  push(data.profile.role);
  push(data.profile.bio);
  push(data.about);

  (data.skills ?? []).forEach(push);
  (data.projects ?? []).forEach((p) => {
    push(p.title);
    push(p.description);
    push(p.tags);
  });

  push(data.contact?.message);
  return out;
}

/** 번역된 배열을 PersonalSchema에 동일 순서로 주입 */
export function applyPersonalTexts(data: PersonalSchema, t: string[]): PersonalSchema {
  let i = 0;
  const next = (orig?: string) => t[i++] || orig || "";
  const s: PersonalSchema = JSON.parse(JSON.stringify(data));

  s.profile.tagline = next(data.profile.tagline);
  s.profile.role    = next(data.profile.role);
  s.profile.bio     = next(data.profile.bio);
  s.about           = next(data.about);

  s.skills = (data.skills ?? []).map(() => next());
  s.projects = (data.projects ?? []).map((p) => ({
    ...p,
    title: next(p.title),
    description: next(p.description),
    tags: next(p.tags),
  }));

  if (s.contact) s.contact.message = next(data.contact?.message);
  return s;
}

/** 별자리 UniverseHome에서 번역할 콘텐츠 텍스트만 수집 */
export function collectUniverseTexts(about: string, tagline: string, role: string): string[] {
  return [about, tagline, role];
}

export function applyUniverseTexts(t: string[]): { about: string; tagline: string; role: string } {
  return { about: t[0] ?? "", tagline: t[1] ?? "", role: t[2] ?? "" };
}
