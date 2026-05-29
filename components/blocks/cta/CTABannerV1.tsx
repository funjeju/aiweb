"use client";

import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { Phone, MessageCircle, Calendar } from "lucide-react";

export function CTABannerV1({ block, site }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const title = (block.data.title as string) || "문의 · 예약";
  const subtitle = (block.data.subtitle as string) || "지금 바로 연락하세요";

  return (
    <section
      className={cn("py-16 px-6 bg-gradient-to-br", theme.gradient)}
    >
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/80 mb-8">{subtitle}</p>

        <div className="flex flex-col gap-3">
          {site.merchantInfo.phone && (
            <a
              href={`tel:${site.merchantInfo.phone}`}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white font-semibold"
              style={{ color: theme.primary }}
            >
              <Phone size={20} />
              {site.merchantInfo.phone}
            </a>
          )}
          {site.externalLinks.kakaoTalk && (
            <a
              href={site.externalLinks.kakaoTalk}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#FEE500] text-[#3B1E08] font-semibold"
            >
              <MessageCircle size={20} />
              카카오톡 문의
            </a>
          )}
          {site.externalLinks.booking && (
            <a
              href={site.externalLinks.booking}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/20 text-white font-semibold border border-white/30"
            >
              <Calendar size={20} />
              예약하기
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
