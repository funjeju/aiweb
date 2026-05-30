"use client";

import Link from "next/link";
import { ArrowLeft, Save, Eye, Settings2, Globe, Loader2, Layers, Radio } from "lucide-react";
import type { SiteSchema } from "@/lib/types/site";
import { cn, getAppUrl } from "@/lib/utils";

interface EditorTopBarProps {
  site: SiteSchema;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onOpenSidebar: () => void;
}

export function EditorTopBar({ site, isDirty, isSaving, onSave, onOpenSidebar }: EditorTopBarProps) {
  const previewUrl = `${getAppUrl()}/${site.siteId}`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-none">{site.merchantInfo.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isDirty ? "저장되지 않은 변경사항" : "모든 변경사항 저장됨"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isDirty && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
              isSaving
                ? "bg-gray-100 text-gray-400"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            )}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? "저장 중" : "저장"}
          </button>
        )}

        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="미리보기">
          <Eye size={18} className="text-gray-600" />
        </a>

        <Link href={`/editor/${site.siteId}/brand-kit`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="마케팅 키트">
          <Layers size={18} className="text-gray-600" />
        </Link>

        <Link href={`/editor/${site.siteId}/live-feed`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Live Feed">
          <Radio size={18} className="text-gray-600" />
        </Link>

        <button
          onClick={onOpenSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="설정"
        >
          <Settings2 size={18} className="text-gray-600" />
        </button>

        {site.published ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-sm">
            <Globe size={14} />
            공개중
          </div>
        ) : (
          <Link
            href={`/editor/${site.siteId}/publish`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700"
          >
            <Globe size={14} />
            공개하기
          </Link>
        )}
      </div>
    </header>
  );
}
