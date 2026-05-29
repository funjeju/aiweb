"use client";

import { useState, useRef } from "react";
import { X, Loader2, Plus, Trash2, Star } from "lucide-react";
import Image from "next/image";
import type { SiteSchema, MenuItem, SiteBlock, BlockComponentType } from "@/lib/types/site";
import { VIBES } from "@/lib/types/site";
import { useEditorStore } from "@/lib/store/editorStore";
import { uploadSiteImage } from "@/lib/firebase/storage";
import { ImageUploader } from "./ImageUploader";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface EditorSidebarProps {
  site: SiteSchema;
  onClose: () => void;
}

type Tab = "design" | "info" | "images" | "menu" | "reviews" | "blocks";

const TAB_LABELS: Record<Tab, string> = {
  design: "디자인", info: "정보", images: "사진", menu: "메뉴", reviews: "리뷰", blocks: "블록",
};

export function EditorSidebar({ site, onClose }: EditorSidebarProps) {
  const [tab, setTab] = useState<Tab>("design");
  const { updateDesignTokens, updateMerchantInfo, toggleBlockVisibility, patchSite } = useEditorStore();

  const updateAssets = (patch: Partial<SiteSchema["contentAssets"]>) =>
    patchSite({ contentAssets: { ...site.contentAssets, ...patch } });

  const updateLinks = (patch: Partial<SiteSchema["externalLinks"]>) =>
    patchSite({ externalLinks: { ...site.externalLinks, ...patch } });

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full fixed right-0 top-0 bottom-0 z-40 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-900">편집 설정</p>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
      </div>

      <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-shrink-0 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
              tab === t ? "text-indigo-600 border-b-2 border-indigo-500" : "text-gray-500")}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ── 디자인 탭 ── */}
        {tab === "design" && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">분위기 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {VIBES.map((vibe) => (
                <button key={vibe.id}
                  onClick={() => updateDesignTokens({ themeId: vibe.id, primaryColor: vibe.primaryColor })}
                  className={cn("p-3 rounded-xl border-2 text-left transition-all",
                    site.designTokens.themeId === vibe.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300")}>
                  <div className="w-6 h-6 rounded-full mb-2" style={{ backgroundColor: vibe.primaryColor }} />
                  <p className="text-xs font-semibold text-gray-800">{vibe.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 정보 탭 ── */}
        {tab === "info" && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">기본 정보</p>
            {([
              { label: "상호명", key: "name", type: "text" },
              { label: "업종", key: "category", type: "text" },
              { label: "전화번호", key: "phone", type: "tel" },
              { label: "주소", key: "address", type: "text" },
              { label: "영업시간", key: "businessHours", type: "text" },
            ] as const).map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={(site.merchantInfo[key] as string) || ""}
                  onChange={(e) => updateMerchantInfo({ [key]: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">소개</label>
              <textarea value={site.merchantInfo.description} onChange={(e) => updateMerchantInfo({ description: e.target.value })}
                rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none resize-none" />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">외부 링크</p>
              {([
                { label: "네이버 플레이스 URL", key: "naverPlace", placeholder: "https://naver.me/..." },
                { label: "인스타그램 URL", key: "instagram", placeholder: "https://instagram.com/..." },
                { label: "카카오톡 채널", key: "kakaoTalk", placeholder: "https://pf.kakao.com/..." },
                { label: "예약 링크", key: "booking", placeholder: "https://..." },
              ] as const).map(({ label, key, placeholder }) => (
                <div key={key} className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type="url" value={site.externalLinks[key] || ""}
                    onChange={(e) => updateLinks({ [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 사진 탭 ── */}
        {tab === "images" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">대표 이미지</p>
              <ImageUploader siteId={site.siteId} type="hero" value={site.contentAssets.heroImage}
                onChange={(url) => updateAssets({ heroImage: url })} onRemove={() => updateAssets({ heroImage: "" })}
                aspectClass="aspect-video" label="대표 이미지 업로드" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">로고</p>
              <ImageUploader siteId={site.siteId} type="logo" value={site.contentAssets.logoImage}
                onChange={(url) => updateAssets({ logoImage: url })} onRemove={() => updateAssets({ logoImage: "" })}
                aspectClass="aspect-square" label="로고 업로드" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">갤러리 ({site.contentAssets.galleryImages.length}장)</p>
              <GalleryUploader siteId={site.siteId} images={site.contentAssets.galleryImages} onChange={(imgs) => updateAssets({ galleryImages: imgs })} />
            </div>
          </div>
        )}

        {/* ── 메뉴 탭 ── */}
        {tab === "menu" && <MenuTab site={site} />}

        {/* ── 리뷰 탭 ── */}
        {tab === "reviews" && <ReviewsTab site={site} />}

        {/* ── 블록 탭 ── */}
        {tab === "blocks" && <BlocksTab site={site} />}
      </div>
    </div>
  );
}

/* ─── GalleryUploader ─── */
function GalleryUploader({ siteId, images, onChange }: { siteId: string; images: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => uploadSiteImage(siteId, "gallery", f)));
      onChange([...images, ...urls]);
    } finally { setUploading(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
            <Image src={src} alt="" fill className="object-cover" />
            <button onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={10} />
            </button>
          </div>
        ))}
        <button onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-indigo-400 transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <Plus size={16} className="text-gray-400" />}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
    </div>
  );
}

/* ─── MenuTab ─── */
function MenuTab({ site }: { site: SiteSchema }) {
  const { patchSite } = useEditorStore();
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateMenuItems = (items: MenuItem[]) => patchSite({ menuData: { ...site.menuData, items } });
  const removeItem = (id: string) => updateMenuItems(site.menuData.items.filter((i) => i.id !== id));
  const addItem = () => updateMenuItems([...site.menuData.items, { id: crypto.randomUUID(), name: "새 메뉴", price: 0 }]);
  const updateItem = (id: string, patch: Partial<MenuItem>) =>
    updateMenuItems(site.menuData.items.map((i) => i.id === id ? { ...i, ...patch } : i));

  const handleOcr = async (file: File) => {
    setOcrLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const { menuItems } = await res.json();
      if (menuItems?.length) updateMenuItems([...site.menuData.items, ...menuItems]);
    } finally { setOcrLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">사진으로 메뉴 추출 (OCR)</p>
        <button onClick={() => fileRef.current?.click()} disabled={ocrLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
          {ocrLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {ocrLoading ? "분석 중..." : "메뉴판 사진 업로드"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOcr(f); }} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">메뉴 목록</p>
          <button onClick={addItem} className="text-xs text-indigo-500 font-semibold flex items-center gap-1"><Plus size={12} />추가</button>
        </div>
        <div className="space-y-2">
          {site.menuData.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="flex gap-2">
                <input value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder="메뉴명" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none" />
                <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
              </div>
              <input type="number" value={item.price} onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                placeholder="가격" className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ReviewsTab ─── */
interface ReviewItem { author: string; rating: number; text: string; date?: string; }

function ReviewsTab({ site }: { site: SiteSchema }) {
  const { updateBlock } = useEditorStore();

  // 리뷰가 있는 블록 찾기
  const reviewBlocks = site.layout.filter((b) =>
    b.componentType.startsWith("Review") && Array.isArray(b.data.reviews)
  );

  const addReview = (blockId: string, reviews: ReviewItem[]) => {
    updateBlock(blockId, { reviews: [...reviews, { author: "방문자", rating: 5, text: "좋았어요!" }] });
  };

  const updateReview = (blockId: string, reviews: ReviewItem[], idx: number, patch: Partial<ReviewItem>) => {
    const next = reviews.map((r, i) => i === idx ? { ...r, ...patch } : r);
    updateBlock(blockId, { reviews: next });
  };

  const removeReview = (blockId: string, reviews: ReviewItem[], idx: number) => {
    updateBlock(blockId, { reviews: reviews.filter((_, i) => i !== idx) });
  };

  if (reviewBlocks.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-8">리뷰 블록이 없습니다.<br/>블록 탭에서 리뷰 블록을 추가하세요.</p>
  );

  return (
    <div className="space-y-6">
      {reviewBlocks.map((block) => {
        const reviews = (block.data.reviews as ReviewItem[]) || [];
        return (
          <div key={block.blockId}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{block.componentType}</p>
              <button onClick={() => addReview(block.blockId, reviews)} className="text-xs text-indigo-500 font-semibold flex items-center gap-1">
                <Plus size={12} />추가
              </button>
            </div>
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={review.author} onChange={(e) => updateReview(block.blockId, reviews, i, { author: e.target.value })}
                      placeholder="작성자" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none" />
                    <button onClick={() => removeReview(block.blockId, reviews, i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => updateReview(block.blockId, reviews, i, { rating: n })}>
                        <Star size={16} fill={n <= review.rating ? "#F59E0B" : "none"} stroke={n <= review.rating ? "#F59E0B" : "#D1D5DB"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={review.text} onChange={(e) => updateReview(block.blockId, reviews, i, { text: e.target.value })}
                    placeholder="리뷰 내용" rows={2}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none resize-none" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── BlocksTab (variation 교체 포함) ─── */
const BLOCK_VARIATIONS: Record<string, BlockComponentType[]> = {
  HeroCentered: ["HeroCentered-v1", "HeroCentered-v2", "HeroCentered-v3"],
  HeroSplit: ["HeroSplit-v1"],
  MenuGrid: ["MenuGrid-v1", "MenuGrid-v2"],
  FeaturedCard: ["FeaturedCard-v1", "FeaturedCard-v2", "FeaturedCard-v3"],
  GalleryGrid: ["GalleryGrid-v1"],
  GalleryMasonry: ["GalleryMasonry-v2"],
  ReviewCarousel: ["ReviewCarousel-v1"],
  ReviewCard: ["ReviewCard-v2"],
  CTABanner: ["CTABanner-v1", "CTABanner-v2"],
  MapBlock: ["MapBlock-v1"],
  ContactBlock: ["ContactBlock-v1"],
  PriceList: ["PriceList-v1"],
  BusinessHours: ["BusinessHours-v1"],
};

function getBlockFamily(componentType: string): string {
  return componentType.replace(/-v\d+$/, "");
}

function BlocksTab({ site }: { site: SiteSchema }) {
  const { toggleBlockVisibility, reorderBlocks } = useEditorStore();
  const { patchSite } = useEditorStore();

  const changeVariation = (blockId: string, newType: BlockComponentType) => {
    const next = site.layout.map((b) => b.blockId === blockId ? { ...b, componentType: newType } : b);
    patchSite({ layout: next });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">블록 관리 · 갈아끼우기</p>
      {site.layout.map((block) => {
        const family = getBlockFamily(block.componentType);
        const variants = BLOCK_VARIATIONS[family] || [];

        return (
          <div key={block.blockId} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 truncate">{family}</p>
              <button onClick={() => toggleBlockVisibility(block.blockId)}
                className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                  block.visible === false ? "bg-gray-200 text-gray-400" : "bg-green-100 text-green-600")}>
                {block.visible === false ? "숨김" : "표시"}
              </button>
            </div>
            {variants.length > 1 && (
              <div className="flex p-2 gap-1.5">
                {variants.map((v) => (
                  <button key={v} onClick={() => changeVariation(block.blockId, v)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      block.componentType === v ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    {v.split("-").pop()?.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
