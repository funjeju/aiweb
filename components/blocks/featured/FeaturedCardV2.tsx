"use client";

import Image from "next/image";
import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

interface FeaturedItem {
  title: string;
  description: string;
  imageUrl?: string;
  badge?: string;
}

export function FeaturedCardV2({ block, site }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const title = (block.data.title as string) || "시그니처";
  const subtitle = block.data.subtitle as string | undefined;
  const items = (block.data.items as FeaturedItem[]) || [];

  const mainItem = items[0];
  const subItems = items.slice(1, 3);

  if (!mainItem && items.length === 0) return null;

  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme.surfaceAlt }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold" style={{ color: theme.text }}>{title}</h2>
          {subtitle && <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{subtitle}</p>}
        </div>

        {mainItem && (
          <div className="rounded-3xl overflow-hidden mb-4" style={{ backgroundColor: theme.surface }}>
            {mainItem.imageUrl && (
              <div className="relative aspect-[16/9]">
                <Image src={mainItem.imageUrl} alt={mainItem.title} fill className="object-cover" />
                {mainItem.badge && (
                  <span
                    className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: theme.primary, color: theme.primaryFg }}
                  >
                    {mainItem.badge}
                  </span>
                )}
              </div>
            )}
            <div className="p-5">
              <p className="font-bold text-lg" style={{ color: theme.text }}>{mainItem.title}</p>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{mainItem.description}</p>
            </div>
          </div>
        )}

        {subItems.length > 0 && (
          <div className={cn("grid gap-4", subItems.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {subItems.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.surface }}>
                {item.imageUrl && (
                  <div className="relative aspect-square">
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm" style={{ color: theme.text }}>{item.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: theme.textMuted }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
