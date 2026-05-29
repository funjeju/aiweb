"use client";

import Image from "next/image";
import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { Phone, MapPin, ExternalLink } from "lucide-react";

export function HeroCenteredV2({ block, site }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const heroImage = (block.data.heroImage as string) || site.contentAssets.heroImage;
  const title = (block.data.title as string) || site.merchantInfo.name;
  const subtitle = (block.data.subtitle as string) || site.merchantInfo.description;
  const badge = block.data.badge as string | undefined;

  return (
    <section className="relative w-full min-h-[85vh] flex items-end overflow-hidden">
      {heroImage ? (
        <>
          <Image src={heroImage} alt={title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </>
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", theme.gradient)} />
      )}

      <div className="relative z-10 w-full px-6 pb-12 max-w-lg mx-auto">
        {badge && (
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: theme.primary, color: theme.primaryFg }}
          >
            {badge}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
          {title}
        </h1>
        {site.merchantInfo.category && (
          <p className="text-sm text-white/70 mb-2">{site.merchantInfo.category}</p>
        )}
        {subtitle && (
          <p className="text-base text-white/85 mb-6 leading-relaxed">{subtitle}</p>
        )}

        <div className="flex gap-3">
          {site.merchantInfo.phone && (
            <a
              href={`tel:${site.merchantInfo.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold"
              style={{ backgroundColor: theme.primary }}
            >
              <Phone size={18} />
              전화
            </a>
          )}
          {site.merchantInfo.address && (
            <a
              href={`https://map.naver.com/search/${encodeURIComponent(site.merchantInfo.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/15 backdrop-blur text-white font-semibold border border-white/20"
            >
              <MapPin size={18} />
              길찾기
            </a>
          )}
          {site.externalLinks.naverPlace && (
            <a
              href={site.externalLinks.naverPlace}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-3.5 rounded-2xl bg-white/15 backdrop-blur text-white border border-white/20"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
