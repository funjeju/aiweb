"use client";

import { useState, useRef } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import type { SiteSchema, MenuItem } from "@/lib/types/site";
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

type Tab = "design" | "info" | "images" | "menu" | "blocks";

const TAB_LABELS: Record<Tab, string> = {
  design: "디자인",
  info: "정보",
  images: "사진",
  menu: "메뉴",
  blocks: "블록",
};

export function EditorSidebar({ site, onClose }: EditorSidebarProps) {
  const [tab, setTab] = useState<Tab>("design");
  const {
    updateDesignTokens, updateMerchantInfo, toggleBlockVisibility, patchSite,
  } = useEditorStore();

  const updateAssets = (patch: Partial<SiteSchema["contentAssets"]>) => {
    patchSite({ contentAssets: { ...site.contentAssets, ...patch } });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full fixed right-0 top-0 bottom-0 z-40 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-900">편집 설정</p>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-shrink-0 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
              tab === t ? "text-indigo-600 border-b-2 border-indigo-500" : "text-gray-500"
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* 디자인 탭 */}
        {tab === "design" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">분위기 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {VIBES.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => updateDesignTokens({ themeId: vibe.id, primaryColor: vibe.primaryColor })}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    site.designTokens.themeId === vibe.id
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="w-6 h-6 rounded-full mb-2" style={{ backgroundColor: vibe.primaryColor }} />
                  <p className="text-xs font-semibold text-gray-800">{vibe.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 정보 탭 */}
        {tab === "info" && (
          <div className="space-y-4">
            {[
              { label: "상호명", key: "name" as const, type: "text" },
              { label: "업종", key: "category" as const, type: "text" },
              { label: "전화번호", key: "phone" as const, type: "tel" },
              { label: "주소", key: "address" as const, type: "text" },
              { label: "영업시간", key: "businessHours" as const, type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={(site.merchantInfo[key] as string) || ""}
                  onChange={(e) => updateMerchantInfo({ [key]: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">소개</label>
              <textarea
                value={site.merchantInfo.description}
                onChange={(e) => updateMerchantInfo({ description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* 사진 탭 */}
        {tab === "images" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">대표 이미지</p>
              <ImageUploader
                siteId={site.siteId}
                type="hero"
                value={site.contentAssets.heroImage}
                onChange={(url) => updateAssets({ heroImage: url })}
                onRemove={() => updateAssets({ heroImage: "" })}
                aspectClass="aspect-video"
                label="대표 이미지 업로드"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">로고</p>
              <ImageUploader
                siteId={site.siteId}
                type="logo"
                value={site.contentAssets.logoImage}
                onChange={(url) => updateAssets({ logoImage: url })}
                onRemove={() => updateAssets({ logoImage: "" })}
                aspectClass="aspect-square"
                label="로고 업로드"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                갤러리 ({site.contentAssets.galleryImages.length}장)
              </p>
              <GalleryUploader siteId={site.siteId} images={site.contentAssets.galleryImages} onChange={(imgs) => updateAssets({ galleryImages: imgs })} />
            </div>
          </div>
        )}

        {/* 메뉴 탭 */}
        {tab === "menu" && (
          <MenuTab site={site} />
        )}

        {/* 블록 탭 */}
        {tab === "blocks" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">블록 표시 관리</p>
            <div className="space-y-2">
              {site.layout.map((block) => (
                <div key={block.blockId} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                  <p className="text-xs font-medium text-gray-700">{block.componentType}</p>
                  <button
                    onClick={() => toggleBlockVisibility(block.blockId)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-lg font-medium",
                      block.visible === false ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-600"
                    )}
                  >
                    {block.visible === false ? "숨김" : "표시"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryUploader({ siteId, images, onChange }: { siteId: string; images: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => uploadSiteImage(siteId, "gallery", f))
      );
      onChange([...images, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
            <Image src={src} alt="" fill className="object-cover" />
            <button
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-indigo-400 transition-colors"
        >
          {uploading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <Plus size={16} className="text-gray-400" />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
      />
    </div>
  );
}

function MenuTab({ site }: { site: SiteSchema }) {
  const { patchSite } = useEditorStore();
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateMenuItems = (items: MenuItem[]) => {
    patchSite({ menuData: { ...site.menuData, items } });
  };

  const handleOcr = async (file: File) => {
    setOcrLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const { menuItems } = await res.json();
      if (menuItems?.length) {
        updateMenuItems([...site.menuData.items, ...menuItems]);
      }
    } finally {
      setOcrLoading(false);
    }
  };

  const removeItem = (id: string) => updateMenuItems(site.menuData.items.filter((i) => i.id !== id));

  const addItem = () => updateMenuItems([
    ...site.menuData.items,
    { id: crypto.randomUUID(), name: "새 메뉴", price: 0 },
  ]);

  const updateItem = (id: string, patch: Partial<MenuItem>) =>
    updateMenuItems(site.menuData.items.map((i) => i.id === id ? { ...i, ...patch } : i));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">사진으로 메뉴 추출 (OCR)</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={ocrLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
        >
          {ocrLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {ocrLoading ? "분석 중..." : "메뉴판 사진 업로드"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOcr(f); }} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">메뉴 목록</p>
          <button onClick={addItem} className="text-xs text-indigo-500 font-semibold flex items-center gap-1">
            <Plus size={12} />추가
          </button>
        </div>
        <div className="space-y-2">
          {site.menuData.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder="메뉴명"
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none"
                />
                <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={12} />
                </button>
              </div>
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                placeholder="가격"
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
