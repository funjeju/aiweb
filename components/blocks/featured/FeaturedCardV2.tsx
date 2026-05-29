"use client";

import Image from "next/image";
import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { InlineEdit } from "@/components/editor/InlineEdit";

interface FeaturedItem { title: string; description: string; imageUrl?: string; badge?: string; }

export function FeaturedCardV2({ block, site, isEditing, onEdit }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const title = (block.data.title as string) || "시그니처";
  const subtitle = block.data.subtitle as string | undefined;
  const items = (block.data.items as FeaturedItem[]) || [];
  const mainItem = items[0];
  const subItems = items.slice(1, 3);

  const updateItem = (idx: number, patch: Partial<FeaturedItem>) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it);
    onEdit?.(block.blockId, { items: next });
  };

  if (!mainItem && items.length === 0) return null;

  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme.surfaceAlt }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <InlineEdit value={title} onChange={(v) => onEdit?.(block.blockId, { title: v })} isEditing={isEditing} tag="h2" className="text-2xl font-bold" style={{ color: theme.text } as React.CSSProperties} placeholder="섹션 제목" />
          {subtitle !== undefined && (
            <InlineEdit value={subtitle || ""} onChange={(v) => onEdit?.(block.blockId, { subtitle: v })} isEditing={isEditing} tag="p" className="text-sm mt-1" style={{ color: theme.textMuted } as React.CSSProperties} placeholder="부제목" />
          )}
        </div>

        {mainItem && (
          <div className="rounded-3xl overflow-hidden mb-4" style={{ backgroundColor: theme.surface }}>
            {mainItem.imageUrl && (
              <div className="relative aspect-[16/9]">
                <Image src={mainItem.imageUrl} alt={mainItem.title} fill className="object-cover" />
                {mainItem.badge && <span className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: theme.primary, color: theme.primaryFg }}>{mainItem.badge}</span>}
              </div>
            )}
            <div className="p-5">
              <InlineEdit value={mainItem.title} onChange={(v) => updateItem(0, { title: v })} isEditing={isEditing} tag="p" className="font-bold text-lg" style={{ color: theme.text } as React.CSSProperties} placeholder="제목" />
              <InlineEdit value={mainItem.description} onChange={(v) => updateItem(0, { description: v })} isEditing={isEditing} tag="p" className="text-sm mt-1" style={{ color: theme.textMuted } as React.CSSProperties} placeholder="설명" multiline />
            </div>
          </div>
        )}

        {subItems.length > 0 && (
          <div className={cn("grid gap-4", subItems.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {subItems.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.surface }}>
                {item.imageUrl && <div className="relative aspect-square"><Image src={item.imageUrl} alt={item.title} fill className="object-cover" /></div>}
                <div className="p-3">
                  <InlineEdit value={item.title} onChange={(v) => updateItem(i + 1, { title: v })} isEditing={isEditing} tag="p" className="font-semibold text-sm" style={{ color: theme.text } as React.CSSProperties} placeholder="제목" />
                  <InlineEdit value={item.description} onChange={(v) => updateItem(i + 1, { description: v })} isEditing={isEditing} tag="p" className="text-xs mt-0.5 line-clamp-2" style={{ color: theme.textMuted } as React.CSSProperties} placeholder="설명" multiline />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
