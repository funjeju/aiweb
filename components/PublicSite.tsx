"use client";

import { useState } from "react";
import type { SiteSchema } from "@/lib/types/site";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { collectTexts, applyTexts, type Lang } from "@/lib/i18n/translateSite";
import { Phone, MessageCircle, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicSiteProps {
  site: SiteSchema;
}

const LANGS: Array<{ id: Lang; label: string }> = [
  { id: "ko", label: "KOR" },
  { id: "en", label: "ENG" },
  { id: "zh", label: "中文" },
];

export function PublicSite({ site: original }: PublicSiteProps) {
  const [lang, setLang] = useState<Lang>("ko");
  const [site, setSite] = useState<SiteSchema>(original);
  const [loading, setLoading] = useState(false);
  // 번역 결과 캐시 (언어별)
  const [cache, setCache] = useState<Record<string, SiteSchema>>({ ko: original });

  const switchLang = async (target: Lang) => {
    if (target === lang || loading) return;
    if (cache[target]) {
      setSite(cache[target]);
      setLang(target);
      return;
    }
    setLoading(true);
    try {
      const texts = collectTexts(original);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, lang: target }),
      });
      const { translations } = await res.json();
      const translated = applyTexts(original, translations || []);
      setCache((c) => ({ ...c, [target]: translated }));
      setSite(translated);
      setLang(target);
    } catch {
      // 실패 시 원문 유지
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 언어 토글 (우상단 고정) */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1 bg-white/90 backdrop-blur rounded-full border border-gray-200 shadow-sm p-1">
        {loading && <Loader2 size={13} className="animate-spin text-indigo-400 ml-1.5" />}
        <Globe size={13} className="text-gray-400 ml-1" />
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => switchLang(l.id)}
            disabled={loading}
            className={cn(
              "text-[11px] font-bold px-2 py-1 rounded-full transition-colors",
              lang === l.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {site.layout.map((block) => (
        <BlockRenderer key={block.blockId} block={block} site={site} />
      ))}

      {(site.merchantInfo.phone || site.externalLinks.kakaoTalk) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 safe-bottom z-50">
          {site.merchantInfo.phone && (
            <a href={`tel:${original.merchantInfo.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gray-900">
              <Phone size={18} />{lang === "en" ? "Call" : lang === "zh" ? "电话" : "전화하기"}
            </a>
          )}
          {site.externalLinks.kakaoTalk && (
            <a href={site.externalLinks.kakaoTalk} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-[#FEE500] text-[#3B1E08]">
              <MessageCircle size={18} />{lang === "en" ? "KakaoTalk" : lang === "zh" ? "聊天" : "카카오톡"}
            </a>
          )}
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
