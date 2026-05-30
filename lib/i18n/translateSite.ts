import type { SiteSchema } from "@/lib/types/site";

export type Lang = "ko" | "en" | "zh";

/**
 * SiteSchema에서 번역 대상 문자열을 순서대로 수집한다.
 * (전화/URL/가격/이미지 등은 제외)
 */
export function collectTexts(site: SiteSchema): string[] {
  const texts: string[] = [];
  const push = (s?: string) => texts.push(s || "");

  push(site.merchantInfo.name);
  push(site.merchantInfo.category);
  push(site.merchantInfo.description);
  push(site.merchantInfo.address);
  push(site.merchantInfo.businessHours);

  for (const item of site.menuData.items) {
    push(item.name);
    push(item.description);
  }

  for (const block of site.layout) {
    const d = block.data as Record<string, unknown>;
    push(d.title as string);
    push(d.subtitle as string);
    push(d.badge as string);
    if (Array.isArray(d.items)) {
      for (const it of d.items as Array<Record<string, unknown>>) {
        push(it.title as string);
        push(it.description as string);
        push(it.value as string);
        push(it.label as string);
      }
    }
    if (Array.isArray(d.reviews)) {
      for (const r of d.reviews as Array<Record<string, unknown>>) {
        push(r.text as string);
      }
    }
  }
  return texts;
}

/**
 * 번역된 문자열 배열을 collectTexts와 동일 순서로 SiteSchema에 다시 주입한다.
 */
export function applyTexts(site: SiteSchema, t: string[]): SiteSchema {
  let i = 0;
  const next = (orig: string | undefined) => t[i++] || orig || "";

  const s: SiteSchema = JSON.parse(JSON.stringify(site));

  s.merchantInfo.name = next(site.merchantInfo.name);
  s.merchantInfo.category = next(site.merchantInfo.category);
  s.merchantInfo.description = next(site.merchantInfo.description);
  s.merchantInfo.address = next(site.merchantInfo.address);
  s.merchantInfo.businessHours = next(site.merchantInfo.businessHours);

  s.menuData.items.forEach((item, idx) => {
    item.name = next(site.menuData.items[idx].name);
    item.description = next(site.menuData.items[idx].description);
  });

  s.layout.forEach((block, bIdx) => {
    const od = site.layout[bIdx].data as Record<string, unknown>;
    const nd = block.data as Record<string, unknown>;
    nd.title = next(od.title as string);
    nd.subtitle = next(od.subtitle as string);
    nd.badge = next(od.badge as string);
    if (Array.isArray(od.items)) {
      (nd.items as Array<Record<string, unknown>>).forEach((it, j) => {
        const oit = (od.items as Array<Record<string, unknown>>)[j];
        it.title = next(oit.title as string);
        it.description = next(oit.description as string);
        it.value = next(oit.value as string);
        it.label = next(oit.label as string);
      });
    }
    if (Array.isArray(od.reviews)) {
      (nd.reviews as Array<Record<string, unknown>>).forEach((r, j) => {
        const orr = (od.reviews as Array<Record<string, unknown>>)[j];
        r.text = next(orr.text as string);
      });
    }
  });

  return s;
}
