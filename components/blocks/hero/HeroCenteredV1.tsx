"use client";

import Image from "next/image";
import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { Phone, MapPin } from "lucide-react";

export function HeroCenteredV1({ block, site }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const heroImage = (block.data.heroImage as string) || site.contentAssets.heroImage;
  const title = (block.data.title as string) || site.merchantInfo.name;
  const subtitle = (block.data.subtitle as string) || site.merchantInfo.description;

  return (
    <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden">
      {heroImage ? (
        <>
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", theme.gradient)} />
      )}

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {site.contentAssets.logoImage && (
          <Image
            src={site.contentAssets.logoImage}
            alt={`${title} 로고`}
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-full object-cover"
          />
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-white/90 mb-8 leading-relaxed">{subtitle}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {site.merchantInfo.phone && (
            <a
              href={`tel:${site.merchantInfo.phone}`}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
              style={{ backgroundColor: theme.primary }}
            >
              <Phone size={18} />
              전화 연결
            </a>
          )}
          {site.merchantInfo.address && (
            <a
              href={`https://map.naver.com/search/${encodeURIComponent(site.merchantInfo.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur text-white font-semibold border border-white/30"
            >
              <MapPin size={18} />
              길 찾기
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
