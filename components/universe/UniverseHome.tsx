"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { StarfieldCanvas } from "./StarfieldCanvas";
import { ConstellationPreview } from "./ConstellationPreview";
import { FloatingAssets } from "./FloatingAssets";
import { UniverseSettings } from "./UniverseSettings";
import { generateConstellation } from "@/lib/universe/stars";
import { getPublishedUniverses, updatePersonal } from "@/lib/firebase/personals";
import { uploadPersonalImage } from "@/lib/firebase/storage";
import { useAuthStore } from "@/lib/store/authStore";
import { DEFAULT_ASSETS } from "@/lib/types/asset";
import type { PersonalSchema, UniverseIconType, UniverseStyle, GalleryItem } from "@/lib/types/personal";
import { useLang, fetchTranslations } from "@/lib/i18n/useLang";
import { collectUniverseTexts, applyUniverseTexts } from "@/lib/i18n/translatePersonal";
import { LangToggle } from "@/components/i18n/LangToggle";
import {
  User, BookOpen, Image as ImageIcon, Sparkles, X,
  Link2, Music, FileText, ArrowRight, Loader2,
  Github, Instagram, Linkedin, Globe, Mail,
  ChevronLeft, ChevronRight, Pencil, Plus, Check, Settings,
  Play, Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── 타입 ────────────────────────────────────── */

export interface UniverseMenu { id: string; label: string; icon: UniverseIconType; }

export interface UniverseData {
  name: string;
  color: string;
  favoriteNumber: number;
  menus: UniverseMenu[];
  about?: string;
  style?: UniverseStyle;
  photo?: string;
  tagline?: string;
  role?: string;
  socials?: { github?: string; instagram?: string; linkedin?: string; twitter?: string; website?: string; email?: string; };
  galleryItems?: GalleryItem[];
  selectedAssets?: string[];
  bgm?: { url: string; name: string; autoPlay?: boolean };
  menuLayout?: Record<string, { top: string; left: string }>;
  assetPositions?: Record<string, { top: string; left: string }>;
  ownerId?: string;
  personalId?: string;
}

const ICON: Record<UniverseIconType, React.ReactNode> = {
  profile: <User size={20} />, diary: <BookOpen size={20} />, gallery: <ImageIcon size={20} />,
  link: <Link2 size={20} />, music: <Music size={20} />, note: <FileText size={20} />,
};

const DEFAULT_POS = [
  { top: "18%", left: "50%" }, { top: "50%", left: "16%" }, { top: "50%", left: "84%" },
  { top: "82%", left: "50%" }, { top: "26%", left: "22%" }, { top: "26%", left: "78%" },
];

/* ─── 내 소개 패널 ─────────────────────────────── */

function ProfilePanel({ data, isOwner }: { data: UniverseData; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ role: data.role ?? "", tagline: data.tagline ?? "", about: data.about ?? "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!data.personalId) return;
    setSaving(true);
    try {
      await updatePersonal(data.personalId, {
        profile: { name: data.name, tagline: form.tagline, role: form.role, bio: data.about ?? "", socials: data.socials ?? {} },
        about: form.about,
      });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const socials = data.socials ?? {};

  if (editing) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">내 소개 편집</p>
        {([["role", "직함/역할", "예: 프론트엔드 개발자"], ["tagline", "한 줄 소개", "나를 한 문장으로"]] as const).map(([k, label, ph]) => (
          <div key={k}>
            <label className="block text-xs text-white/50 mb-1">{label}</label>
            <input value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph}
              className="w-full px-3 py-2 rounded-xl bg-white/8 border border-white/15 text-sm text-white placeholder-white/25 focus:border-violet-400 focus:outline-none" />
          </div>
        ))}
        <div>
          <label className="block text-xs text-white/50 mb-1">소개글</label>
          <textarea value={form.about} onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))}
            rows={4} placeholder="나를 소개하는 글을 자유롭게 써주세요"
            className="w-full px-3 py-2 rounded-xl bg-white/8 border border-white/15 text-sm text-white placeholder-white/25 focus:border-violet-400 focus:outline-none resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}저장
          </button>
          <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/15">취소</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 shrink-0 bg-white/5 flex items-center justify-center"
          style={{ borderColor: `${data.color}66` }}>
          {data.photo ? <Image src={data.photo} alt={data.name} width={64} height={64} className="w-full h-full object-cover" />
            : <User size={28} className="text-white/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-base leading-tight">{data.name}</p>
          {data.role && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full border"
              style={{ color: data.color, borderColor: `${data.color}55`, backgroundColor: `${data.color}15` }}>
              {data.role}
            </span>
          )}
          {data.tagline && <p className="text-xs text-white/40 mt-1 italic">{data.tagline}</p>}
        </div>
        {isOwner && (
          <button onClick={() => setEditing(true)} className="p-2 rounded-xl bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-colors shrink-0">
            <Pencil size={14} />
          </button>
        )}
      </div>
      {data.about ? <p className="text-white/70 text-sm leading-relaxed">{data.about}</p>
        : isOwner ? (
          <button onClick={() => setEditing(true)} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/30 text-sm hover:border-violet-400 hover:text-violet-400 transition-colors">
            + 소개글 작성하기
          </button>
        ) : <p className="text-white/30 text-sm italic">아직 소개가 작성되지 않았어요.</p>}
      {Object.values(socials).some(Boolean) && (
        <div className="flex flex-wrap gap-2">
          {socials.github && <SocialLink href={socials.github} icon={<Github size={12} />} label="GitHub" />}
          {socials.instagram && <SocialLink href={socials.instagram} icon={<Instagram size={12} />} label="Instagram" />}
          {socials.linkedin && <SocialLink href={socials.linkedin} icon={<Linkedin size={12} />} label="LinkedIn" />}
          {socials.website && <SocialLink href={socials.website} icon={<Globe size={12} />} label="웹사이트" />}
          {socials.email && <SocialLink href={`mailto:${socials.email}`} icon={<Mail size={12} />} label="이메일" />}
        </div>
      )}
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors">
      {icon}{label}
    </a>
  );
}

/* ─── 갤러리 패널 ──────────────────────────────── */

function GalleryPanel({ data, isOwner }: { data: UniverseData; isOwner: boolean }) {
  const [localItems, setLocalItems] = useState<GalleryItem[]>(data.galleryItems ?? []);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !data.personalId) return;
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadPersonalImage(data.personalId, "gallery", file);
        let caption = "";
        try {
          const res = await fetch("/api/personal/gallery-caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: url }) });
          caption = (await res.json()).caption ?? "";
        } catch { /* 캡션 실패해도 진행 */ }
        setLocalItems((prev) => {
          const updated = [...prev, { url, caption }];
          if (data.personalId) {
            // dot-notation으로 universe.galleryItems 필드만 업데이트 (다른 필드 덮어쓰기 방지)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updatePersonal(data.personalId, { "universe.galleryItems": updated } as any).catch(console.error);
          }
          return updated;
        });
      }
    } finally { setUploading(false); e.target.value = ""; }
  };

  const prev = () => setLightboxIdx((i) => (i !== null ? (i - 1 + localItems.length) % localItems.length : null));
  const next = () => setLightboxIdx((i) => (i !== null ? (i + 1) % localItems.length : null));

  return (
    <>
      {localItems.length === 0 && !isOwner ? (
        <div className="flex flex-col items-center py-8 text-white/30 text-sm gap-2"><ImageIcon size={28} />아직 사진이 없어요.</div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {localItems.map((item, i) => (
            <button key={item.url} onClick={() => setLightboxIdx(i)} className="relative aspect-square rounded-xl overflow-hidden group">
              <Image src={item.url} alt="" width={120} height={120} className="w-full h-full object-cover" />
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5">
                  <p className="text-white text-[9px] leading-tight line-clamp-2">{item.caption}</p>
                </div>
              )}
            </button>
          ))}
          {isOwner && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={20} /><span className="text-[10px] mt-1">추가</span></>}
            </button>
          )}
        </div>
      )}
      {isOwner && localItems.length === 0 && (
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="w-full mt-2 py-6 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center gap-2 text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors">
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
          <span className="text-xs">사진 추가하기</span>
          <span className="text-[10px] text-white/20">AI가 감성 캡션을 달아드려요</span>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft size={24} /></button>
          <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={localItems[lightboxIdx].url} alt="" width={1200} height={900} className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl" />
            {localItems[lightboxIdx].caption && (
              <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent px-5 py-4">
                <p className="text-white text-sm text-center italic">{localItems[lightboxIdx].caption}</p>
              </div>
            )}
            <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs">{lightboxIdx + 1} / {localItems.length}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight size={24} /></button>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><X size={20} /></button>
        </div>
      )}
    </>
  );
}

/* ─── 메뉴 콘텐츠 ──────────────────────────────── */

function MenuContent({ menu, data, isOwner }: { menu: UniverseMenu; data: UniverseData; isOwner: boolean }) {
  switch (menu.icon) {
    case "profile": return <ProfilePanel data={data} isOwner={isOwner} />;
    case "gallery": return <GalleryPanel data={data} isOwner={isOwner} />;
    case "diary":   return <p className="text-white/50 text-sm py-4 text-center">AI 다이어리는 곧 연동됩니다.</p>;
    case "link":    return <p className="text-white/50 text-sm py-4 text-center">링크 모음은 곧 추가됩니다.</p>;
    case "music":   return <p className="text-white/50 text-sm py-4 text-center">음악 공간은 곧 추가됩니다.</p>;
    case "note":    return <p className="text-white/50 text-sm py-4 text-center">메모 공간은 곧 추가됩니다.</p>;
    default: return null;
  }
}

/* ─── 이웃 구경 모달 ───────────────────────────── */

function NeighborModal({ onClose, fromId }: { onClose: () => void; fromId?: string }) {
  const [universes, setUniverses] = useState<PersonalSchema[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (universes !== null) return;
    setLoading(true);
    try {
      const list = await getPublishedUniverses(30);
      setUniverses([...list].sort(() => Math.random() - 0.5).slice(0, 12));
    } catch { setUniverses([]); } finally { setLoading(false); }
  }, [universes]);

  if (universes === null && !loading) load();

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-xl bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2 text-white"><Sparkles size={18} className="text-violet-400" /><h2 className="font-bold text-base">이웃 별자리 구경</h2></div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {loading && <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-violet-400" /></div>}
          {!loading && universes?.length === 0 && <p className="text-center text-white/40 text-sm py-12">아직 다른 별자리가 없어요.</p>}
          {!loading && universes && universes.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {universes.map((p) => (
                <a key={p.id} href={`/p/${p.id}${fromId ? `?from=${fromId}` : ""}`}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-square flex flex-col hover:border-white/30 transition-colors bg-[#080b1d]">
                  <div className="flex-1 relative">
                    <ConstellationPreview name={p.profile.name} color={p.universe!.color} favoriteNumber={p.universe!.favoriteNumber} />
                  </div>
                  <div className="p-2 bg-black/30 backdrop-blur-sm shrink-0">
                    <p className="text-white text-xs font-semibold truncate">{p.profile.name}</p>
                    <p className="text-white/40 text-[10px] truncate">{p.profile.tagline || "별자리 우주"}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ArrowRight size={12} className="text-white" /></span>
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

/* ─── BGM 플레이어 버튼 (오디오는 UniverseHome에서 단일 관리) ── */

function BgmPlayerButton({ bgm, color, playing, onToggle }: {
  bgm: NonNullable<UniverseData["bgm"]>;
  color: string;
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <button onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm border text-white/70 text-xs hover:text-white transition-colors"
      style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}
      title={bgm.name}>
      {playing ? <Pause size={13} /> : <Play size={13} />}
      <span className="max-w-[100px] truncate">{bgm.name}</span>
    </button>
  );
}

/* ─── 메인 컴포넌트 ────────────────────────────── */

/* UI 텍스트 정적 번역 */
const UI = {
  ko: { constellationOf: "Constellation of", suffix: "님의 별자리", neighbor: "랜덤 이웃 구경", backTo: "내 우주로", settings: "설정" },
  en: { constellationOf: "Constellation of", suffix: "'s Universe",  neighbor: "Visit Neighbors",  backTo: "My Universe", settings: "Settings" },
  zh: { constellationOf: "属于",               suffix: "的宇宙",        neighbor: "随机邻居",          backTo: "我的宇宙",  settings: "设置" },
} as const;

export function UniverseHome({ data: initialData }: { data: UniverseData }) {
  const [data, setData] = useState(initialData);
  const constellation = generateConstellation(data.name, data.color, data.favoriteNumber);
  const [openMenu, setOpenMenu] = useState<UniverseMenu | null>(null);
  const [showNeighbors, setShowNeighbors] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from") ?? undefined;

  const { user } = useAuthStore();

  // ── 단일 오디오 인스턴스 (BGM) ──────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bgmPlaying, setBgmPlaying] = useState(false);

  useEffect(() => {
    const bgm = data.bgm;
    if (!bgm?.url) { audioRef.current?.pause(); audioRef.current = null; setBgmPlaying(false); return; }
    // URL이 바뀐 경우만 새 Audio 생성
    if (audioRef.current && audioRef.current.src !== bgm.url) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
      setBgmPlaying(false);
    }
    if (!audioRef.current) {
      const audio = new Audio(bgm.url);
      audio.loop = true;
      audioRef.current = audio;
    }
    if (bgm.autoPlay) {
      audioRef.current.play().then(() => setBgmPlaying(true)).catch(() => {});
    }
    return () => {
      // 언마운트 시 정리
      audioRef.current?.pause();
    };
  // data.bgm.url이 바뀔 때만 재실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.bgm?.url, data.bgm?.autoPlay]);

  const toggleBgm = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (bgmPlaying) { audio.pause(); setBgmPlaying(false); }
    else { audio.play().then(() => setBgmPlaying(true)).catch(() => {}); }
  };
  const isOwner = !!user && !!data.ownerId && user.uid === data.ownerId;

  // 다국어
  const { lang, setLang } = useLang();
  const [langLoading, setLangLoading] = useState(false);
  const [transCache, setTransCache] = useState<Record<string, { about: string; tagline: string; role: string }>>({});

  // 현재 표시할 번역된 콘텐츠
  const displayed = transCache[lang] ?? { about: initialData.about ?? "", tagline: initialData.tagline ?? "", role: initialData.role ?? "" };

  const switchLang = async (target: typeof lang) => {
    if (target === lang || langLoading) return;
    setLang(target);
    if (target === "ko" || transCache[target]) return;
    setLangLoading(true);
    try {
      const texts = collectUniverseTexts(initialData.about ?? "", initialData.tagline ?? "", initialData.role ?? "");
      const translations = await fetchTranslations(texts, target);
      const applied = applyUniverseTexts(translations);
      setTransCache((c) => ({ ...c, [target]: applied }));
    } catch { /* 원문 유지 */ }
    finally { setLangLoading(false); }
  };

  const ui = UI[lang];

  const style = data.style ?? {};

  // 설정 저장 후 로컬 상태 갱신
  const handleSettingsSaved = (state: { selectedAssets: string[]; bgm: { url: string; name: string; autoPlay: boolean } | null; menuLayout: Record<string, { top: string; left: string }>; assetPositions: Record<string, { top: string; left: string }> }) => {
    setData((prev) => ({
      ...prev,
      selectedAssets: state.selectedAssets,
      bgm: state.bgm ?? undefined,
      menuLayout: Object.keys(state.menuLayout).length > 0 ? state.menuLayout : undefined,
      assetPositions: Object.keys(state.assetPositions).length > 0 ? state.assetPositions : undefined,
    }));
  };

  // 메뉴 노드 위치: menuLayout 있으면 우선, 없으면 DEFAULT_POS
  const getMenuPos = (menuId: string, idx: number) =>
    data.menuLayout?.[menuId] ?? DEFAULT_POS[idx] ?? { top: "50%", left: "50%" };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05060f]">
      <StarfieldCanvas
        constellation={constellation}
        skyTheme={style.skyTheme ?? "deep-space"}
        lineStyle={style.lineStyle ?? "flow"}
        starGlow={style.starGlow ?? "default"}
      />

      {/* 떠다니는 에셋 */}
      {data.selectedAssets && data.selectedAssets.length > 0 && (
        <FloatingAssets
          selectedIds={data.selectedAssets}
          seed={constellation.seed}
          customPositions={data.assetPositions}
        />
      )}

      {/* ← 이전 우주로 돌아가기 */}
      {fromId && (
        <a href={`/p/${fromId}`}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/70 text-xs font-medium hover:bg-black/50 hover:text-white transition-colors">
          <ChevronLeft size={14} />{ui.backTo}
        </a>
      )}

      {/* 우상단: 언어 토글 + 설정 버튼 */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LangToggle lang={lang} loading={langLoading} onSwitch={switchLang} theme="dark" />
        {isOwner && (
          <button onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/50 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
            <Settings size={13} />{ui.settings}
          </button>
        )}
      </div>

      {/* 중앙 별자리 이름 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
        <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: data.color }}>{ui.constellationOf}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
          {data.name}<span className="text-white/60">{ui.suffix}</span>
        </h1>
      </div>

      {/* 메뉴 노드 — 위치는 menuLayout 우선 */}
      {(data.menus ?? []).slice(0, 6).map((menu, i) => {
        const pos = getMenuPos(menu.id, i);
        return (
          <button key={menu.id} onClick={() => setOpenMenu(menu)}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: pos.top, left: pos.left }}>
            <span className="flex flex-col items-center gap-2">
              <span className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm border transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}88`, color: "#fff", boxShadow: `0 0 20px ${data.color}55` }}>
                {ICON[menu.icon]}
              </span>
              <span className="text-xs font-medium text-white/80">{menu.label}</span>
            </span>
          </button>
        );
      })}

      {/* 하단 액션 + BGM 플레이어 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {data.bgm && <BgmPlayerButton bgm={data.bgm} color={data.color} playing={bgmPlaying} onToggle={toggleBgm} />}
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white backdrop-blur-sm border"
          style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}66` }}
          onClick={() => setShowNeighbors(true)}>
          <Sparkles size={15} />{ui.neighbor}
        </button>
      </div>

      {/* 메뉴 패널 */}
      {openMenu && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpenMenu(null)}>
          <div className="w-full sm:max-w-md bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 m-0 sm:m-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <span style={{ color: data.color }}>{ICON[openMenu.icon]}</span>
                <h2 className="font-bold text-lg">{openMenu.label}</h2>
              </div>
              <button onClick={() => setOpenMenu(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-[80px]">
              <MenuContent menu={openMenu} data={{ ...data, about: displayed.about, tagline: displayed.tagline, role: displayed.role }} isOwner={isOwner} />
            </div>
          </div>
        </div>
      )}

      {/* 이웃 구경 모달 */}
      {showNeighbors && <NeighborModal onClose={() => setShowNeighbors(false)} fromId={data.personalId} />}

      {/* 설정 패널 */}
      {showSettings && data.personalId && (
        <UniverseSettings
          personalId={data.personalId}
          menus={data.menus ?? []}
          initialAssets={data.selectedAssets ?? []}
          initialBgm={data.bgm}
          initialLayout={data.menuLayout}
          initialAssetPositions={data.assetPositions}
          allAssets={DEFAULT_ASSETS}
          bgmPlaying={bgmPlaying}
          onToggleBgm={toggleBgm}
          onClose={() => setShowSettings(false)}
          onSaved={handleSettingsSaved}
        />
      )}
    </div>
  );
}
