"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getSiteById, updateSite } from "@/lib/firebase/sites";
import { useEditorStore } from "@/lib/store/editorStore";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { EditorTopBar } from "./EditorTopBar";
import { EditorSidebar } from "./EditorSidebar";
import { VibeChat } from "./VibeChat";
import { Loader2, GripVertical, Sparkles, Monitor, Smartphone } from "lucide-react";
import type { SiteBlock } from "@/lib/types/site";
import { cn } from "@/lib/utils";

interface SiteEditorProps {
  siteId: string;
}

export function SiteEditor({ siteId }: SiteEditorProps) {
  const { site, setSite, updateBlock, reorderBlocks, isDirty, isSaving, setIsSaving, markClean } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    getSiteById(siteId).then((s) => {
      if (s) setSite(s);
      setLoading(false);
    });
  }, [siteId, setSite]);

  const handleSave = async () => {
    if (!site || !isDirty) return;
    setIsSaving(true);
    try {
      await updateSite(siteId, {
        layout: site.layout,
        merchantInfo: site.merchantInfo,
        designTokens: site.designTokens,
        menuData: site.menuData,
        contentAssets: site.contentAssets,
      });
      markClean();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !site) return;
    const oldIdx = site.layout.findIndex((b) => b.blockId === active.id);
    const newIdx = site.layout.findIndex((b) => b.blockId === over.id);
    reorderBlocks(arrayMove(site.layout, oldIdx, newIdx));
  };

  if (loading || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <EditorTopBar
        site={site}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto py-6 px-4">
          {/* 데스크탑/모바일 미리보기 토글 */}
          <div className="flex items-center justify-center gap-1 mb-4">
            <div className="inline-flex bg-white rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setViewMode("desktop")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  viewMode === "desktop" ? "bg-indigo-500 text-white" : "text-gray-500")}>
                <Monitor size={14} />PC
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  viewMode === "mobile" ? "bg-indigo-500 text-white" : "text-gray-500")}>
                <Smartphone size={14} />모바일
              </button>
            </div>
          </div>

          <div className={cn(
            "mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-200 transition-all",
            viewMode === "mobile" ? "max-w-sm" : "max-w-5xl"
          )}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={site.layout.map((b) => b.blockId)} strategy={verticalListSortingStrategy}>
                {site.layout.map((block) => (
                  <SortableBlock
                    key={block.blockId}
                    block={block}
                    site={site}
                    onEdit={(blockId, data) => updateBlock(blockId, data)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">블록을 드래그해서 순서를 바꿀 수 있어요</p>
        </div>

        {sidebarOpen && (
          <EditorSidebar site={site} onClose={() => setSidebarOpen(false)} />
        )}
      </div>

      {/* AI 편집 도우미 플로팅 버튼 */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-500 text-white font-semibold shadow-lg hover:bg-indigo-600 transition-colors"
        >
          <Sparkles size={18} />
          AI 편집
        </button>
      )}
      {chatOpen && <VibeChat site={site} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

function SortableBlock({ block, site, onEdit }: { block: SiteBlock; site: Parameters<typeof BlockRenderer>[0]["site"]; onEdit: (id: string, d: Record<string, unknown>) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.blockId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative group"
    >
      <BlockRenderer block={block} site={site} isEditing onEdit={onEdit} />
      {/* Drag handle — 호버 시 표시 */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-lg p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        title="드래그해서 순서 변경"
      >
        <GripVertical size={14} className="text-gray-400" />
      </button>
      {block.visible === false && (
        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">숨김</span>
        </div>
      )}
    </div>
  );
}
