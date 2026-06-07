"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Globe, Loader2, ExternalLink, Languages } from "lucide-react";
import type { StarArchiveData } from "@/lib/data/star-archive";
import { getPublicStarComments } from "@/lib/firebase/starComments";
import type { StarComment } from "@/lib/firebase/starComments";
import { getPersonalsByStarSlug } from "@/lib/firebase/personals";
import type { PersonalSchema } from "@/lib/types/personal";
import { BRIGHT_STARS } from "@/lib/universe/stars";
import { cn } from "@/lib/utils";

/* 국기 이모지 (ISO 3166-1 alpha-2 → emoji) */
function countryFlag(code?: string): string {
  if (!code || code.length !== 2) return "";
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

type Lang = "en" | "ko";

export function StarArchivePage({ star }: { star: StarArchiveData }) {
  const [lang, setLang] = useState<Lang>("en");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#05060f] text-white">
      {/* 배경 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #08030f 55%, #05060f 100%)"
        }} />
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              top: `${(i * 37 + 13) % 100}%`,
              left: `${(i * 61 + 7) % 100}%`,
              width: i % 5 === 0 ? 2 : 1,
              height: i % 5 === 0 ? 2 : 1,
              opacity: 0.1 + (i % 7) * 0.05,
            }} />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
        {/* 상단 내비 */}
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} />
            <span>돌아가기</span>
          </button>
          {/* 언어 토글 */}
          <button
            onClick={() => setLang((l) => l === "en" ? "ko" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/60">
            <Globe size={12} />
            {lang === "en" ? "한국어" : "English"}
          </button>
        </div>

        {/* 헤더 */}
        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest mb-2 font-semibold">
            {star.constellation[lang]}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-1"
            style={{ textShadow: "0 0 40px rgba(167,139,250,0.4)" }}>
            {star.nameEn}
          </h1>
          <p className="text-lg text-white/50 mb-4">{star.nameKo}</p>
          <p className="text-white/70 text-base leading-relaxed">{star.shortDesc[lang]}</p>
        </div>

        {/* 천문 데이터 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {[
            { label: lang === "en" ? "Distance" : "거리", value: `${star.distanceLy} ly` },
            { label: lang === "en" ? "Magnitude" : "밝기", value: star.magnitude.toString() },
            { label: lang === "en" ? "Spectral Type" : "분광형", value: star.spectralType },
            { label: lang === "en" ? "Luminosity" : "광도", value: star.luminosity },
            { label: lang === "en" ? "Radius" : "반지름", value: star.radius },
            { label: lang === "en" ? "Best Season" : "관측 시기", value: star.bestSeasons[0]?.[lang] ?? "—" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
              <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* 상세 설명 */}
        <div className="rounded-2xl bg-white/5 border border-white/8 p-6 mb-8">
          <p className="text-white/70 leading-relaxed text-sm">{star.longDesc[lang]}</p>
        </div>

        {/* 관측 가능 지역 */}
        <div className="mb-8">
          <h2 className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
            {lang === "en" ? "Visible From" : "관측 가능 지역"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {star.observableRegions.map((r, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-400/25 text-violet-300 text-xs">
                {r[lang]}
              </span>
            ))}
          </div>
        </div>

        {/* 문화·신화 */}
        {star.mythology.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
              {lang === "en" ? "Mythology & Culture" : "신화와 문화"}
            </h2>
            <div className="space-y-4">
              {star.mythology.map((m, i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/8 p-5">
                  <p className="text-xs text-violet-400 font-semibold mb-2">{m.culture[lang]}</p>
                  <p className="text-white/65 text-sm leading-relaxed">{m.story[lang]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이 별을 가진 사람들 */}
        <div className="mb-8">
          <h2 className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
            {lang === "en" ? "People with this star" : "이 별을 가진 사람들"}
          </h2>
          <StarOwners slug={star.slug} lang={lang} />
        </div>

        {/* 이야기 섹션 */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
            {lang === "en" ? "Stories from people with this star" : "이 별을 가진 사람들의 이야기"}
          </h2>
          <StarStories slug={star.slug} lang={lang} />
        </div>

        {/* 하단 */}
        <div className="mt-12 pt-8 border-t border-white/8 text-center">
          <p className="text-xs text-white/20">
            {lang === "en"
              ? "Data based on Yale Bright Star Catalog & public astronomical records."
              : "예일 밝은 별 카탈로그 및 공개 천문 기록 기반 데이터."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 이 별을 가진 사람들 (랜덤) ─── */

function StarOwners({ slug, lang }: { slug: string; lang: Lang }) {
  const [owners, setOwners] = useState<PersonalSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonalsByStarSlug(slug, 20)
      .then(setOwners)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 size={16} className="text-white/30 animate-spin" />
      </div>
    );
  }

  if (owners.length === 0) {
    return (
      <p className="text-sm text-white/25 py-2">
        {lang === "en" ? "No one has this star yet." : "아직 이 별을 가진 사람이 없어요."}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {owners.map((p) => {
        const u = p.universe;
        if (!u) return null;
        const color = u.color ?? "#a78bfa";
        const displayName = p.profile?.name ?? "익명";
        const photo = p.profile?.photo;
        return (
          <a
            key={p.id}
            href={`/p/${p.id}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors hover:bg-white/10"
            style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
          >
            {photo ? (
              <img src={photo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                style={{ backgroundColor: `${color}30`, color }}>
                {displayName[0] ?? "★"}
              </div>
            )}
            <span className="text-xs font-medium text-white/75 max-w-[100px] truncate">{displayName}</span>
          </a>
        );
      })}
    </div>
  );
}

/* ─── 이 별을 가진 사람들의 공개 코멘트 ─── */

function StarStories({ slug, lang }: { slug: string; lang: Lang }) {
  const [comments, setComments] = useState<StarComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore starComments는 별 이름(nameEn 또는 nameKo)으로 저장됨
    // slug → 가능한 이름 모두 시도
    const star = BRIGHT_STARS.find((s) => s.slug === slug);
    const names = star
      ? [star.nameEn, star.nameKo].filter(Boolean)
      : [slug];

    Promise.all(names.map((n) => getPublicStarComments(n, 20)))
      .then((results) => {
        // 중복 제거 (id 기준)
        const seen = new Set<string>();
        const merged = results.flat().filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
        // 최신순 정렬
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setComments(merged.slice(0, 20));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={18} className="text-white/30 animate-spin" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className={cn("text-sm text-white/30 text-center py-4")}>
        {lang === "en"
          ? "Be the first to leave a story about this star."
          : "이 별에 대한 첫 번째 이야기를 남겨보세요."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <StoryCard key={c.id} comment={c} lang={lang} />
      ))}
    </div>
  );
}

function StoryCard({ comment: c, lang }: { comment: StarComment; lang: Lang }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const toggleTranslate = async () => {
    if (translated && !showOriginal) { setShowOriginal(true); return; }
    if (translated && showOriginal) { setShowOriginal(false); return; }
    setTranslating(true);
    try {
      const target = lang === "en" ? "en" : "ko";
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(c.text)}`);
      const data = await res.json();
      const text = (data[0] as [string][]).map(([t]) => t).join("");
      setTranslated(text);
      setShowOriginal(false);
    } catch { /* 무시 */ }
    finally { setTranslating(false); }
  };

  const flag = countryFlag(c.authorNationality);
  const slugBase = typeof window !== "undefined" ? window.location.origin : "";
  const profileUrl = c.authorPublicSlug
    ? `${slugBase}/p/${c.authorPublicSlug}`
    : null;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(c.createdAt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return lang === "en" ? "just now" : "방금";
    if (m < 60) return lang === "en" ? `${m}m ago` : `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return lang === "en" ? `${h}h ago` : `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 30) return lang === "en" ? `${d}d ago` : `${d}일 전`;
    return new Date(c.createdAt).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric" });
  })();

  return (
    <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4 space-y-2.5">
      {/* 작성자 행 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 닉네임 */}
        <span className="text-xs font-semibold text-white/80">{c.authorName}</span>

        {/* 국기 */}
        {flag && <span className="text-sm leading-none">{flag}</span>}

        {/* 별자리 링크 */}
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[10px] text-violet-400/70 hover:text-violet-400 transition-colors">
            <ExternalLink size={9} />
            <span>별자리 보기</span>
          </a>
        )}

        {/* 시간 */}
        <span className="ml-auto text-[10px] text-white/25">{timeAgo}</span>
      </div>

      {/* 코멘트 본문 */}
      <p className="text-sm text-white/70 leading-relaxed">
        {translated && !showOriginal ? translated : c.text}
      </p>

      {/* 번역 버튼 */}
      <button onClick={toggleTranslate} disabled={translating}
        className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors">
        {translating
          ? <Loader2 size={9} className="animate-spin" />
          : <Languages size={9} />}
        {translating
          ? (lang === "en" ? "Translating…" : "번역 중…")
          : translated
            ? showOriginal ? (lang === "en" ? "Show translation" : "번역 보기") : (lang === "en" ? "Show original" : "원문 보기")
            : (lang === "en" ? "Translate" : "번역")}
      </button>
    </div>
  );
}
