"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublishedSites } from "@/lib/firebase/sites";
import type { SiteSchema } from "@/lib/types/site";
import { getAppUrl } from "@/lib/utils";
import { MapPin, Loader2, ExternalLink, Radio } from "lucide-react";

const CATEGORY_EMOJI: Record<string, string> = {
  cafe: "☕", restaurant: "🍽️", beauty: "✂️", stay: "🏡", attraction: "⛰️", general: "🏪",
};

export function MainLiveFeed() {
  const [sites, setSites] = useState<SiteSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const appUrl = getAppUrl();

  useEffect(() => {
    getPublishedSites()
      .then((s) => setSites(s))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <Radio className="w-7 h-7 text-indigo-400" />
        </div>
        <p className="font-semibold text-gray-800 mb-1">아직 공개된 가게가 없어요</p>
        <p className="text-sm text-gray-500">첫 가게 홈페이지를 만들어보세요</p>
        <Link href="/create" className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">
          홈페이지 만들기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl font-bold text-gray-900">지금 제주의 가게들</h1>
        <span className="text-xs text-gray-400">{sites.length}곳</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {sites.map((site) => {
          const hero = site.contentAssets?.heroImage;
          const emoji = CATEGORY_EMOJI[site.siteType] || "🏪";
          return (
            <a
              key={site.siteId}
              href={`${appUrl}/${site.siteId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl overflow-hidden bg-white border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                {hero ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero} alt={site.merchantInfo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">{emoji}</div>
                )}
                <span className="absolute top-2 left-2 text-xs font-semibold bg-white/90 backdrop-blur px-2 py-0.5 rounded-full">
                  {emoji} {site.merchantInfo.category || "가게"}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-gray-900 truncate">{site.merchantInfo.name}</p>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-indigo-500 flex-shrink-0" />
                </div>
                {site.merchantInfo.description && (
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{site.merchantInfo.description}</p>
                )}
                {site.merchantInfo.address && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <MapPin size={11} className="flex-shrink-0" />
                    <span className="truncate">{site.merchantInfo.address}</span>
                  </p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
