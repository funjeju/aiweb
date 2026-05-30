"use client";

import { forwardRef } from "react";
import { getThemeTokens } from "@/lib/design/tokens";
import type { ThemeId } from "@/lib/types/site";
import { QRCode } from "@/components/QRCode";
import { Phone, MapPin, Globe } from "lucide-react";

export interface BusinessCardData {
  name: string;
  category?: string;
  phone?: string;
  address?: string;
  description?: string;
  url?: string;
  themeId: ThemeId;
}

/** 디지털 명함 미리보기 (체험판·마케팅키트 공용). html2canvas로 캡처. */
export const BusinessCardPreview = forwardRef<HTMLDivElement, { data: BusinessCardData }>(
  function BusinessCardPreview({ data }, ref) {
    const theme = getThemeTokens(data.themeId);
    return (
      <div
        ref={ref}
        className="rounded-3xl overflow-hidden shadow-xl"
        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)` }}
      >
        <div className="p-6 flex gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              {data.category && (
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{data.category}</p>
              )}
              <p className="text-white text-2xl font-bold mt-1 break-keep">{data.name || "상호명"}</p>
            </div>
            {data.description && <p className="text-white/80 text-sm mb-5 line-clamp-2">{data.description}</p>}
            <div className="space-y-2">
              {data.phone && (
                <div className="flex items-center gap-2 text-white/90 text-sm"><Phone size={14} /><span>{data.phone}</span></div>
              )}
              {data.address && (
                <div className="flex items-center gap-2 text-white/90 text-sm"><MapPin size={14} /><span className="line-clamp-1">{data.address}</span></div>
              )}
            </div>
          </div>
          {data.url && (
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="bg-white p-1.5 rounded-xl"><QRCode value={data.url} size={72} /></div>
              <span className="text-white/60 text-[10px]">스캔하기</span>
            </div>
          )}
        </div>
        {data.url && (
          <div className="bg-white/10 px-6 py-3 flex items-center gap-2">
            <Globe size={12} className="text-white/60" />
            <span className="text-white/60 text-xs truncate">{data.url}</span>
          </div>
        )}
      </div>
    );
  }
);
