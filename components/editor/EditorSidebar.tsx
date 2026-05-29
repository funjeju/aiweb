"use client";

import { useState } from "react";
import { X, Palette, Store, Layout } from "lucide-react";
import type { SiteSchema } from "@/lib/types/site";
import { VIBES } from "@/lib/types/site";
import { useEditorStore } from "@/lib/store/editorStore";
import { cn } from "@/lib/utils";

interface EditorSidebarProps {
  site: SiteSchema;
  onClose: () => void;
}

type Tab = "design" | "info" | "blocks";

export function EditorSidebar({ site, onClose }: EditorSidebarProps) {
  const [tab, setTab] = useState<Tab>("design");
  const { updateDesignTokens, updateMerchantInfo, toggleBlockVisibility } = useEditorStore();

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full fixed right-0 top-0 bottom-0 z-40 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-900">편집</p>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["design", "info", "blocks"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors",
              tab === t ? "text-indigo-600 border-b-2 border-indigo-500" : "text-gray-500"
            )}
          >
            {t === "design" ? "디자인" : t === "info" ? "정보" : "블록"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
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
                  <div
                    className="w-6 h-6 rounded-full mb-2"
                    style={{ backgroundColor: vibe.primaryColor }}
                  />
                  <p className="text-xs font-semibold text-gray-800">{vibe.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "info" && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">기본 정보</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">상호명</label>
              <input
                type="text"
                value={site.merchantInfo.name}
                onChange={(e) => updateMerchantInfo({ name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">소개</label>
              <textarea
                value={site.merchantInfo.description}
                onChange={(e) => updateMerchantInfo({ description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">전화번호</label>
              <input
                type="tel"
                value={site.merchantInfo.phone}
                onChange={(e) => updateMerchantInfo({ phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">주소</label>
              <input
                type="text"
                value={site.merchantInfo.address}
                onChange={(e) => updateMerchantInfo({ address: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {tab === "blocks" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">블록 관리</p>
            <div className="space-y-2">
              {site.layout.map((block) => (
                <div
                  key={block.blockId}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{block.componentType}</p>
                  </div>
                  <button
                    onClick={() => toggleBlockVisibility(block.blockId)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-lg font-medium",
                      block.visible === false
                        ? "bg-gray-100 text-gray-400"
                        : "bg-green-50 text-green-600"
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
