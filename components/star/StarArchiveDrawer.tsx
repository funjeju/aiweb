"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Star, ChevronRight, Telescope } from "lucide-react";
import { getStarArchive } from "@/lib/data/star-archive";
import { BRIGHT_STARS } from "@/lib/universe/stars";
import { cn } from "@/lib/utils";

interface Props {
  slugs: string[];
  color: string;
  onClose: () => void;
}

export function StarArchiveDrawer({ slugs, color, onClose }: Props) {
  const [filter, setFilter] = useState<"all" | "known" | "unknown">("all");

  // slug → 별 데이터 + BRIGHT_STARS 매핑
  const entries = slugs.map((slug) => {
    const archive = getStarArchive(slug);
    const brightStar = BRIGHT_STARS.find((s) => s.slug === slug);
    return {
      slug,
      nameEn: archive?.nameEn ?? brightStar?.nameEn ?? slug,
      nameKo: archive?.nameKo ?? brightStar?.nameKo ?? slug,
      constellation: archive?.constellation.ko ?? "—",
      magnitude: archive?.magnitude ?? brightStar?.mag ?? null,
      distanceLy: archive?.distanceLy ?? null,
      shortDesc: archive?.shortDesc.ko ?? null,
      hasArchive: !!archive,
    };
  });

  const filtered = entries.filter((e) => {
    if (filter === "known") return e.hasArchive;
    if (filter === "unknown") return !e.hasArchive;
    return true;
  });

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-[#0a0f24] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Star size={16} style={{ color }} />
            <h2 className="text-base font-bold text-white">별 도감</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
              {slugs.length}개 수집
            </span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 필터 */}
        <div className="flex gap-1.5 px-5 pb-3 shrink-0">
          {([
            { key: "all", label: "전체" },
            { key: "known", label: "아카이브 있음" },
            { key: "unknown", label: "미등재" },
          ] as const).map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-white/40 hover:text-white/70"
              )}>
              {f.label}
            </button>
          ))}
        </div>

        {/* 별 목록 */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Telescope size={32} className="text-white/20" />
              <p className="text-white/30 text-sm">아직 발견한 별이 없어요</p>
              <p className="text-white/20 text-xs text-center leading-relaxed">
                다른 사람의 우주를 방문해서<br />새로운 별을 발견해보세요
              </p>
            </div>
          ) : (
            filtered.map((entry) => (
              <StarCard key={entry.slug} entry={entry} color={color} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StarCard({
  entry,
  color,
}: {
  entry: {
    slug: string;
    nameEn: string;
    nameKo: string;
    constellation: string;
    magnitude: number | null;
    distanceLy: number | null;
    shortDesc: string | null;
    hasArchive: boolean;
  };
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/8 p-4 flex items-center gap-3 group hover:border-white/15 transition-colors">
      {/* 별 아이콘 */}
      <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
        style={{ backgroundColor: `${color}20`, boxShadow: `0 0 12px ${color}33` }}>
        <span className="text-white text-base">✦</span>
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-white">{entry.nameEn}</p>
          <p className="text-xs text-white/35">{entry.nameKo}</p>
        </div>
        <p className="text-xs text-white/40 mb-1">{entry.constellation}
          {entry.magnitude !== null && <span className="ml-2">등급 {entry.magnitude}</span>}
          {entry.distanceLy !== null && <span className="ml-2">{entry.distanceLy} ly</span>}
        </p>
        {entry.shortDesc && (
          <p className="text-xs text-white/30 truncate">{entry.shortDesc}</p>
        )}
      </div>

      {/* 아카이브 링크 */}
      {entry.hasArchive ? (
        <Link href={`/star/${entry.slug}`}
          className="shrink-0 flex items-center gap-1 text-xs text-violet-400/60 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100">
          <span>아카이브</span>
          <ChevronRight size={12} />
        </Link>
      ) : (
        <span className="shrink-0 text-[10px] text-white/20 px-2 py-1 rounded-full border border-white/8">
          미등재
        </span>
      )}
    </div>
  );
}
