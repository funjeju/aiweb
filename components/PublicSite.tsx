"use client";

import type { SiteSchema } from "@/lib/types/site";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { Phone, MessageCircle } from "lucide-react";

interface PublicSiteProps {
  site: SiteSchema;
}

export function PublicSite({ site }: PublicSiteProps) {
  return (
    <div className="min-h-screen bg-white">
      {site.layout.map((block) => (
        <BlockRenderer key={block.blockId} block={block} site={site} />
      ))}

      {/* Sticky bottom CTA bar (mobile) */}
      {(site.merchantInfo.phone || site.externalLinks.kakaoTalk) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 safe-bottom z-50">
          {site.merchantInfo.phone && (
            <a
              href={`tel:${site.merchantInfo.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gray-900"
            >
              <Phone size={18} />
              전화하기
            </a>
          )}
          {site.externalLinks.kakaoTalk && (
            <a
              href={site.externalLinks.kakaoTalk}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-[#FEE500] text-[#3B1E08]"
            >
              <MessageCircle size={18} />
              카카오톡
            </a>
          )}
        </div>
      )}

      <div className="h-20" /> {/* Bottom padding for sticky bar */}
    </div>
  );
}
