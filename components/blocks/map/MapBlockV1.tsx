"use client";

import type { BlockProps } from "../BlockProps";
import { getThemeTokens } from "@/lib/design/tokens";
import { SectionHeader } from "../SectionHeader";
import { MapPin, Clock, Navigation } from "lucide-react";

export function MapBlockV1({ block, site, isEditing, onEdit }: BlockProps) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const title = (block.data.title as string) || "위치 안내";
  const { address, businessHours, name } = site.merchantInfo;
  const { lat, lng } = site.merchantInfo.coordinates || {};

  const mapUrl = lat && lng
    ? `https://map.naver.com/p?lat=${lat}&lng=${lng}&zoom=16`
    : `https://map.naver.com/search/${encodeURIComponent(address || name)}`;

  const naverMapUrl = address
    ? `nmap://search?query=${encodeURIComponent(address)}&appname=com.example.aiweb`
    : undefined;

  return (
    <section className="py-20 px-6" style={{ backgroundColor: theme.surface }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <SectionHeader eyebrow="Location" title={title}
            onTitleChange={(v) => onEdit?.(block.blockId, { title: v })} isEditing={isEditing} theme={theme} />
        </div>

        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-2xl overflow-hidden border mb-4"
          style={{ borderColor: theme.border }}
        >
          {lat && lng ? (
            <iframe
              title="위치 지도"
              src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
              className="w-full h-52 pointer-events-none"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-52 flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: theme.surfaceAlt }}
            >
              <MapPin size={32} style={{ color: theme.primary }} />
              <p className="text-sm font-medium" style={{ color: theme.textMuted }}>지도 보기</p>
            </div>
          )}
        </a>

        <div className="space-y-3 mb-4">
          {address && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
              <p className="text-sm" style={{ color: theme.text }}>{address}</p>
            </div>
          )}
          {businessHours && (
            <div className="flex items-start gap-3">
              <Clock size={18} className="flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
              <p className="text-sm" style={{ color: theme.text }}>{businessHours}</p>
            </div>
          )}
        </div>

        <a
          href={naverMapUrl || mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold border"
          style={{ color: theme.text, borderColor: theme.border }}
        >
          <Navigation size={18} style={{ color: theme.primary }} />
          네이버 지도로 길찾기
        </a>
      </div>
    </section>
  );
}
