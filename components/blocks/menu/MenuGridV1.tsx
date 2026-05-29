"use client";

import Image from "next/image";
import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { formatPrice } from "@/lib/utils";

export function MenuGridV1({ block, site }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const title = (block.data.title as string) || "메뉴";
  const items = site.menuData.items.slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme.surface }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: theme.text }}>
          {title}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: theme.border, backgroundColor: theme.surfaceAlt }}
            >
              {item.imageUrl ? (
                <div className="relative aspect-[4/3]">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
              ) : (
                <div
                  className="aspect-[4/3] flex items-center justify-center text-4xl"
                  style={{ backgroundColor: theme.surfaceAlt }}
                >
                  ☕
                </div>
              )}
              <div className="p-3">
                <p className="font-semibold text-sm" style={{ color: theme.text }}>
                  {item.name}
                </p>
                {item.description && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: theme.textMuted }}>
                    {item.description}
                  </p>
                )}
                <p className="text-sm font-bold mt-1" style={{ color: theme.primary }}>
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
