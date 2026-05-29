"use client";

import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { SectionHeader } from "../SectionHeader";
import { Star } from "lucide-react";

interface ReviewItem { author: string; rating: number; text: string; date?: string; }

export function ReviewCarouselV1({ block, site, isEditing, onEdit }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const title = (block.data.title as string) || "고객 후기";
  const reviews = (block.data.reviews as ReviewItem[]) || [];

  if (reviews.length === 0) return null;

  return (
    <section className="py-20" style={{ backgroundColor: theme.accent }}>
      <div className="max-w-2xl mx-auto px-6">
        <SectionHeader
          eyebrow="Reviews"
          title={title}
          onTitleChange={(v) => onEdit?.(block.blockId, { title: v })}
          isEditing={isEditing}
          theme={theme}
        />
      </div>

      <div className="mt-10 flex gap-4 overflow-x-auto hide-scrollbar px-6 snap-x snap-mandatory">
        {reviews.map((review, i) => (
          <figure
            key={i}
            className="flex-shrink-0 w-[78%] sm:w-80 snap-start rounded-3xl p-6 flex flex-col"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
          >
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={14}
                  fill={j < review.rating ? theme.primary : "transparent"}
                  stroke={j < review.rating ? theme.primary : theme.border} />
              ))}
            </div>
            <blockquote className="text-[15px] leading-relaxed flex-1" style={{ color: theme.text }}>
              “{review.text}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: theme.accent, color: theme.primary }}>
                {review.author?.[0] || "방"}
              </span>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>{review.author}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
