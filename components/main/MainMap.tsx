"use client";

import { useEffect, useRef, useState } from "react";
import { getPublishedSites } from "@/lib/firebase/sites";
import type { SiteSchema } from "@/lib/types/site";
import { getAppUrl } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";

let kakaoLoaderPromise: Promise<void> | null = null;
function loadKakaoSdk(appKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if ((window as unknown as { kakao?: { maps?: unknown } }).kakao?.maps) return Promise.resolve();
  if (kakaoLoaderPromise) return kakaoLoaderPromise;
  kakaoLoaderPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      const kakao = (window as unknown as { kakao: { maps: { load: (cb: () => void) => void } } }).kakao;
      kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("kakao sdk load failed"));
    document.head.appendChild(script);
  });
  return kakaoLoaderPromise;
}

// 카테고리별 핀 색
const PIN_COLOR: Record<string, string> = {
  cafe: "#E8590C", restaurant: "#E03131", beauty: "#C2255C",
  stay: "#1971C2", attraction: "#2F9E44", general: "#868E96",
};
const CATEGORY_LABEL: Record<string, string> = {
  cafe: "카페", restaurant: "식당", beauty: "미용", stay: "숙박", attraction: "관광지", general: "기타",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function MainMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sites, setSites] = useState<SiteSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const appUrl = getAppUrl();

  useEffect(() => {
    getPublishedSites().then((s) => setSites(s)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !appKey || !containerRef.current) return;
    const withCoords = sites.filter((s) => s.merchantInfo.coordinates?.lat && s.merchantInfo.coordinates?.lng);

    loadKakaoSdk(appKey).then(() => {
      const kakao = (window as any).kakao;
      if (!containerRef.current) return;
      // 제주 중심 기본
      const center = withCoords[0]?.merchantInfo.coordinates
        ? new kakao.maps.LatLng(withCoords[0].merchantInfo.coordinates!.lat, withCoords[0].merchantInfo.coordinates!.lng)
        : new kakao.maps.LatLng(33.38, 126.55);
      const map = new kakao.maps.Map(containerRef.current, { center, level: 9 });
      const bounds = new kakao.maps.LatLngBounds();

      withCoords.forEach((site) => {
        const { lat, lng } = site.merchantInfo.coordinates!;
        const pos = new kakao.maps.LatLng(lat, lng);
        const color = PIN_COLOR[site.siteType] || PIN_COLOR.general;
        // 커스텀 오버레이 핀
        const el = document.createElement("div");
        el.style.cssText = `transform:translate(-50%,-100%);cursor:pointer;`;
        el.innerHTML = `<div style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${site.merchantInfo.name}</div><div style="width:8px;height:8px;background:${color};transform:rotate(45deg);margin:-4px auto 0;"></div>`;
        el.onclick = () => window.open(`${appUrl}/${site.siteId}`, "_blank");
        const overlay = new kakao.maps.CustomOverlay({ position: pos, content: el, yAnchor: 1 });
        overlay.setMap(map);
        bounds.extend(pos);
      });

      if (withCoords.length > 1) map.setBounds(bounds);
    }).catch(() => setFailed(true));
  }, [loading, sites, appKey, appUrl]);

  const withCoords = sites.filter((s) => s.merchantInfo.coordinates?.lat);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">지도에서 보기</h1>
        <span className="text-xs text-gray-400">{withCoords.length}곳 표시</span>
      </div>

      {/* 카테고리 범례 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIN_COLOR[key] }} />
            {label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-indigo-400 animate-spin" /></div>
      ) : failed ? (
        <div className="rounded-2xl border border-gray-200 h-[60vh] flex flex-col items-center justify-center gap-2 text-gray-400">
          <MapPin size={28} /><p className="text-sm">지도를 불러올 수 없습니다</p>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-[60vh] rounded-2xl overflow-hidden border border-gray-200" />
      )}
    </div>
  );
}
