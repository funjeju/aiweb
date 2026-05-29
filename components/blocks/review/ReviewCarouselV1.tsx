"use client";

import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { Star } from "lucide-react";

interface ReviewItem {
  author: string;
  rating: number;
  text: string;
  date?: string;
}

export function ReviewCarouselV1({ block, site }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const title = (block.data.title as string) || "리뷰";
  const reviews = (block.data.reviews as ReviewItem[]) || [];

  if (reviews.length === 0) return null;

  return (
    <section className="py-16" style={{ backgroundColor: theme.surfaceAlt }}>
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: theme.text }}>
          {title}
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-6 pb-4">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 rounded-2xl p-5 border"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  size={14}
                  fill={j < review.rating ? theme.primary : "none"}
                  stroke={j < review.rating ? theme.primary : theme.border}
                />
              ))}
            </div>
            <p className="text-sm leading-relaxed line-clamp-3 mb-3" style={{ color: theme.text }}>
              {review.text}
            </p>
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold" style={{ color: theme.textMuted }}>{review.author}</p>
              {review.date && (
                <p className="text-xs" style={{ color: theme.textMuted }}>{review.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
