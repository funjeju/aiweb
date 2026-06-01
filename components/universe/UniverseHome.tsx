"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { StarfieldCanvas } from "./StarfieldCanvas";
import { ConstellationPreview } from "./ConstellationPreview";
import { generateConstellation } from "@/lib/universe/stars";
import { getPublishedUniverses } from "@/lib/firebase/personals";
import type { PersonalSchema, UniverseIconType, UniverseStyle } from "@/lib/types/personal";
import {
  User, BookOpen, Image as ImageIcon, Sparkles, X,
  Link2, Music, FileText, ArrowRight, Loader2,
  Github, Instagram, Linkedin, Globe, Mail,
  ChevronLeft, ChevronRight,
} from "lucide-react";

export interface UniverseMenu {
  id: string;
  label: string;
  icon: UniverseIconType;
}

export interface UniverseData {
  name: string;
  color: string;
  favoriteNumber: number;
  menus: UniverseMenu[];
  about?: string;
  style?: UniverseStyle;
  // 내 소개 패널용
  photo?: string;
  tagline?: string;
  role?: string;
  socials?: {
    github?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
  };
  // 갤러리 패널용
  galleryImages?: string[];
}

const ICON: Record<UniverseIconType, React.ReactNode> = {
  profile: <User size={20} />,
  diary:   <BookOpen size={20} />,
  gallery: <ImageIcon size={20} />,
  link:    <Link2 size={20} />,
  music:   <Music size={20} />,
  note:    <FileText size={20} />,
};

const MENU_POS = [
  { top: "18%", left: "50%" },
  { top: "50%", left: "16%" },
  { top: "50%", left: "84%" },
  { top: "82%", left: "50%" },
  { top: "26%", left: "22%" },
  { top: "26%", left: "78%" },
];

/* ── 내 소개 패널 ──────────────────────────────── */
function ProfilePanel({ data }: { data: UniverseData }) {
  const socials = data.socials ?? {};
  const hasSocials = Object.values(socials).some(Boolean);

  return (
    <div className="space-y-4">
      {/* 프로필 사진 + 기본 정보 */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shrink-0 bg-white/5 flex items-center justify-center">
          {data.photo
            ? <Image src={data.photo} alt={data.name} width={64} height={64} className="w-full h-full object-cover" />
            : <User size={28} className="text-white/30" />
          }
        </div>
        <div>
          <p className="font-bold text-white text-base leading-tight">{data.name}</p>
          {data.role && <p className="text-xs text-white/60 mt-0.5">{data.role}</p>}
          {data.tagline && <p className="text-xs text-white/40 mt-0.5 italic">{data.tagline}</p>}
        </div>
      </div>

      {/* 소개글 */}
      {data.about ? (
        <p className="text-white/70 text-sm leading-relaxed">{data.about}</p>
      ) : (
        <p className="text-white/30 text-sm italic">아직 소개가 작성되지 않았어요.</p>
      )}

      {/* 소셜 링크 */}
      {hasSocials && (
        <div className="flex flex-wrap gap-2 pt-1">
          {socials.github && (
            <a href={socials.github} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors">
              <Github size={12} />GitHub
            </a>
          )}
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors">
              <Instagram size={12} />Instagram
            </a>
          )}
          {socials.linkedin && (
            <a href={socials.linkedin} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors">
              <Linkedin size={12} />LinkedIn
            </a>
          )}
          {socials.website && (
            <a href={socials.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors">
              <Globe size={12} />웹사이트
            </a>
          )}
          {socials.email && (
            <a href={`mailto:${socials.email}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-colors">
              <Mail size={12} />이메일
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 갤러리 패널 ──────────────────────────────── */
function GalleryPanel({ images, color }: { images?: string[]; color: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ImageIcon size={32} className="text-white/20 mb-2" />
        <p className="text-white/30 text-sm">아직 사진이 없어요.</p>
        <p className="text-white/20 text-xs mt-1">편집 페이지에서 사진을 추가해보세요.</p>
      </div>
    );
  }

  const prev = () => setLightboxIdx((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const next = () => setLightboxIdx((i) => (i !== null ? (i + 1) % images.length : null));

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {images.map((url, i) => (
          <button
            key={url}
            onClick={() => setLightboxIdx(i)}
            className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image src={url} alt="" width={120} height={120} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* 라이트박스 */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lightboxIdx]}
              alt=""
              width={1200}
              height={900}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            />
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-xs">
              {lightboxIdx + 1} / {images.length}
            </p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight size={24} />
          </button>

          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  );
}

/* ── 메뉴 콘텐츠 디스패처 ──────────────────────── */
function MenuContent({ menu, data }: { menu: UniverseMenu; data: UniverseData }) {
  switch (menu.icon) {
    case "profile":
      return <ProfilePanel data={data} />;
    case "gallery":
      return <GalleryPanel images={data.galleryImages} color={data.color} />;
    case "diary":
      return <p className="text-white/50 text-sm py-4 text-center">AI와 대화하며 하루를 기록하는 다이어리예요.<br />곧 연동 예정입니다.</p>;
    case "link":
      return <p className="text-white/50 text-sm py-4 text-center">링크 모음은 곧 추가됩니다.</p>;
    case "music":
      return <p className="text-white/50 text-sm py-4 text-center">좋아하는 음악 공간. 곧 추가됩니다.</p>;
    case "note":
      return <p className="text-white/50 text-sm py-4 text-center">짧은 메모 공간. 곧 추가됩니다.</p>;
    default:
      return null;
  }
}

/* ── 이웃 구경 모달 ────────────────────────────── */
function NeighborModal({ onClose }: { onClose: () => void }) {
  const [universes, setUniverses] = useState<PersonalSchema[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (universes !== null) return;
    setLoading(true);
    try {
      const list = await getPublishedUniverses(30);
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      setUniverses(shuffled.slice(0, 12));
    } catch {
      setUniverses([]);
    } finally {
      setLoading(false);
    }
  }, [universes]);

  if (universes === null && !loading) load();

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-xl bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-violet-400" />
            <h2 className="font-bold text-base">이웃 별자리 구경</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {loading && <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-violet-400" /></div>}
          {!loading && universes?.length === 0 && (
            <p className="text-center text-white/40 text-sm py-12">아직 다른 별자리가 없어요.<br />첫 이웃이 되어 보세요!</p>
          )}
          {!loading && universes && universes.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {universes.map((p) => (
                <a key={p.id} href={`/p/${p.id}`}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-square flex flex-col hover:border-white/30 transition-colors"
                  style={{ backgroundColor: "#080b1d" }}>
                  <div className="flex-1 relative">
                    <ConstellationPreview name={p.profile.name} color={p.universe!.color} favoriteNumber={p.universe!.favoriteNumber} />
                  </div>
                  <div className="p-2 bg-black/30 backdrop-blur-sm shrink-0">
                    <p className="text-white text-xs font-semibold truncate">{p.profile.name}</p>
                    <p className="text-white/40 text-[10px] truncate">{p.profile.tagline || "별자리 우주"}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowRight size={12} className="text-white" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 컴포넌트 ─────────────────────────────── */
export function UniverseHome({ data }: { data: UniverseData }) {
  const constellation = generateConstellation(data.name, data.color, data.favoriteNumber);
  const [openMenu, setOpenMenu] = useState<UniverseMenu | null>(null);
  const [showNeighbors, setShowNeighbors] = useState(false);

  const style = data.style ?? {};

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05060f]">
      <StarfieldCanvas
        constellation={constellation}
        skyTheme={style.skyTheme ?? "deep-space"}
        lineStyle={style.lineStyle ?? "flow"}
        starGlow={style.starGlow ?? "default"}
      />

      {/* 중앙 별자리 이름 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
        <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: data.color }}>Constellation of</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
          {data.name}<span className="text-white/60">님의 별자리</span>
        </h1>
      </div>

      {/* 메뉴 노드 */}
      {data.menus.slice(0, MENU_POS.length).map((menu, i) => (
        <button key={menu.id} onClick={() => setOpenMenu(menu)}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
          style={{ top: MENU_POS[i].top, left: MENU_POS[i].left }}>
          <span className="flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm border transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}88`, color: "#fff", boxShadow: `0 0 20px ${data.color}55` }}>
              {ICON[menu.icon]}
            </span>
            <span className="text-xs font-medium text-white/80">{menu.label}</span>
          </span>
        </button>
      ))}

      {/* 하단 액션 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white backdrop-blur-sm border"
          style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}66` }}
          onClick={() => setShowNeighbors(true)}>
          <Sparkles size={15} />랜덤 이웃 구경
        </button>
      </div>

      {/* 메뉴 패널 */}
      {openMenu && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOpenMenu(null)}>
          <div className="w-full sm:max-w-md bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 m-0 sm:m-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <span style={{ color: data.color }}>{ICON[openMenu.icon]}</span>
                <h2 className="font-bold text-lg">{openMenu.label}</h2>
              </div>
              <button onClick={() => setOpenMenu(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-[80px]">
              <MenuContent menu={openMenu} data={data} />
            </div>
          </div>
        </div>
      )}

      {/* 이웃 구경 모달 */}
      {showNeighbors && <NeighborModal onClose={() => setShowNeighbors(false)} />}
    </div>
  );
}
