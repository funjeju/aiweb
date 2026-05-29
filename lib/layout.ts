import type { SiteSchema, SiteBlock } from "@/lib/types/site";

/**
 * 콘텐츠가 있는데 해당 블록이 layout에 없으면 자동으로 보강한다.
 * - 갤러리 이미지 업로드 → GalleryGrid 블록 자동 표시
 * - 메뉴 등록 → MenuGrid 블록 자동 표시
 * 사장님이 데이터만 넣으면 섹션이 알아서 나타나도록.
 */
export function withDerivedBlocks(site: SiteSchema): SiteBlock[] {
  const layout = [...site.layout];
  const types = layout.map((b) => b.componentType);

  const hasGalleryBlock = types.some((t) => t.startsWith("Gallery"));
  const hasMenuBlock = types.some((t) => t.startsWith("MenuGrid") || t.startsWith("PriceList") || t.startsWith("FeaturedCard"));

  // 갤러리 이미지가 있는데 갤러리 블록이 없으면 추가
  if (site.contentAssets.galleryImages?.length > 0 && !hasGalleryBlock) {
    const insertAt = findInsertIndex(layout);
    layout.splice(insertAt, 0, {
      blockId: "auto-gallery",
      componentType: "GalleryGrid-v1",
      data: { title: "갤러리" },
      visible: true,
    });
  }

  // 메뉴가 있는데 메뉴 블록이 없으면 추가
  if (site.menuData.items?.length > 0 && !hasMenuBlock) {
    const insertAt = findInsertIndex(layout);
    layout.splice(insertAt, 0, {
      blockId: "auto-menu",
      componentType: "MenuGrid-v1",
      data: { title: "메뉴" },
      visible: true,
    });
  }

  return layout;
}

/** Hero 다음, Map/Contact/CTA 앞에 삽입할 인덱스를 찾는다. */
function findInsertIndex(layout: SiteBlock[]): number {
  const tailIdx = layout.findIndex(
    (b) =>
      b.componentType.startsWith("MapBlock") ||
      b.componentType.startsWith("Contact") ||
      b.componentType.startsWith("CTABanner")
  );
  if (tailIdx >= 0) return tailIdx;
  return layout.length;
}
