"use client";

import { useEffect, useState } from "react";
import { getSiteById, updateSite } from "@/lib/firebase/sites";
import { useEditorStore } from "@/lib/store/editorStore";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { EditorTopBar } from "./EditorTopBar";
import { EditorSidebar } from "./EditorSidebar";
import { Loader2 } from "lucide-react";

interface SiteEditorProps {
  siteId: string;
}

export function SiteEditor({ siteId }: SiteEditorProps) {
  const { site, setSite, updateBlock, isDirty, isSaving, setIsSaving, markClean } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      <div className="flex flex-1">
        {/* Mobile-first: preview pane */}
        <div className="flex-1 overflow-y-auto">
          {/* Phone frame preview */}
          <div className="max-w-sm mx-auto my-6 rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-200">
            {site.layout.map((block) => (
              <div key={block.blockId} className="relative group">
                <BlockRenderer
                  block={block}
                  site={site}
                  isEditing
                  onEdit={(blockId, data) => updateBlock(blockId, data)}
                />
                {/* Edit overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none">
                  <div className="absolute top-2 right-2 bg-white rounded-lg shadow px-2 py-1 text-xs text-gray-500 pointer-events-auto">
                    {block.componentType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <EditorSidebar site={site} onClose={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  );
}
