"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StarfieldCanvas } from "./StarfieldCanvas";
import { ConstellationPreview } from "./ConstellationPreview";
import { FloatingAssets } from "./FloatingAssets";
import { UniverseSettings } from "./UniverseSettings";
import { generateConstellation, generateConstellationFromSeed } from "@/lib/universe/stars";
import { getStarLore } from "@/lib/universe/star-lore";
import type { ConstellationStar } from "@/lib/universe/stars";
import { getPublishedUniverses, updatePersonal, getPersonalById, getPersonalsByOwner, getStarNeighbors } from "@/lib/firebase/personals";
import { getStarComments, getPublicStarComments, addStarComment, deleteStarComment, updateStarCommentVisibility } from "@/lib/firebase/starComments";
import type { StarComment } from "@/lib/firebase/starComments";
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
  Play, Pause, LogIn, Send, Lock, MessageCircle, PenLine, Trash2,
  Calendar, Search, Volume2, Star,
} from "lucide-react";
import type { DiaryEntry, DiaryEmotion } from "@/lib/types/personal";
import { cn } from "@/lib/utils";

/* ─── 타입 ────────────────────────────────────── */

export interface UniverseMenu { id: string; label: string; icon: UniverseIconType; customIcon?: string; }

export interface BgmTrack { url: string; name: string; autoPlay?: boolean; volume?: number; }

export interface UniverseData {
  name: string;
  color: string;
  favoriteNumber: number;
  constellationSeed?: number;
  menus: UniverseMenu[];
  about?: string;
  style?: UniverseStyle;
  photo?: string;
  tagline?: string;
  role?: string;
  socials?: { github?: string; instagram?: string; linkedin?: string; twitter?: string; website?: string; email?: string; };
  galleryItems?: GalleryItem[];
  diaryEntries?: DiaryEntry[];
  published?: boolean;
  shootingStarIntervalSec?: number;
  selectedAssets?: string[];
  bgmList?: BgmTrack[];
  menuLayout?: Record<string, { top: string; left: string }>;
  menuLayoutMobile?: Record<string, { top: string; left: string }>;
  assetPositions?: Record<string, { top: string; left: string }>;
  assetPositionsMobile?: Record<string, { top: string; left: string }>;
  publicUrl?: string;
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

function ProfilePanel({ data, isOwner, onSaved }: {
  data: UniverseData;
  isOwner: boolean;
  onSaved: (u: { role: string; tagline: string; about: string; photo?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({
    role: data.role ?? "",
    tagline: data.tagline ?? "",
    about: data.about ?? "",
    photo: data.photo ?? "",
  });
  const [form, setForm] = useState({ role: local.role, tagline: local.tagline, about: local.about });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const openEdit = () => {
    setForm({ role: local.role, tagline: local.tagline, about: local.about });
    setEditing(true);
  };

  const save = async () => {
    if (!data.personalId) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePersonal(data.personalId, {
        "profile.role": form.role,
        "profile.tagline": form.tagline,
        "profile.bio": form.about,
        about: form.about,
      } as any);
      const next = { role: form.role, tagline: form.tagline, about: form.about, photo: local.photo };
      setLocal((p) => ({ ...p, ...next }));
      onSaved(next);           // 부모 state 갱신
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data.personalId) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadPersonalImage(data.personalId, "photo", file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePersonal(data.personalId, { "profile.photo": url } as any);
      setLocal((p) => ({ ...p, photo: url }));
      onSaved({ role: local.role, tagline: local.tagline, about: local.about, photo: url });
    } catch { alert("사진 업로드에 실패했습니다."); }
    finally { setUploadingPhoto(false); e.target.value = ""; }
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
        {/* 프로필 사진 — 오너면 클릭 업로드 */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 bg-white/5 flex items-center justify-center"
            style={{ borderColor: `${data.color}66` }}>
            {local.photo
              ? <Image src={local.photo} alt={data.name} width={64} height={64} className="w-full h-full object-cover" />
              : <User size={28} className="text-white/30" />}
          </div>
          {isOwner && (
            <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center border-2 border-[#0b1026] hover:bg-violet-600 transition-colors">
              {uploadingPhoto ? <Loader2 size={10} className="animate-spin text-white" /> : <Plus size={10} className="text-white" />}
            </button>
          )}
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-base leading-tight">{data.name}</p>
          {local.role && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full border"
              style={{ color: data.color, borderColor: `${data.color}55`, backgroundColor: `${data.color}15` }}>
              {local.role}
            </span>
          )}
          {local.tagline && <p className="text-xs text-white/40 mt-1 italic">{local.tagline}</p>}
        </div>
        {isOwner && (
          <button onClick={openEdit} className="p-2 rounded-xl bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-colors shrink-0">
            <Pencil size={14} />
          </button>
        )}
      </div>

      {/* 소개글 */}
      {local.about
        ? <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{local.about}</p>
        : isOwner
          ? <button onClick={openEdit} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/30 text-sm hover:border-violet-400 hover:text-violet-400 transition-colors">
              + 소개글 작성하기
            </button>
          : <p className="text-white/30 text-sm italic">아직 소개가 작성되지 않았어요.</p>}

      {/* 도메인 주소 + 복사 버튼 — publicUrl 없으면 현재 origin 기반 직접 URL */}
      {(() => {
        const url = data.publicUrl
          || (data.personalId && typeof window !== "undefined"
            ? `${window.location.origin}/p/${data.personalId}` : null);
        return url ? <UrlCopyRow url={url} color={data.color} /> : null;
      })()}

      {Object.values(socials).some(Boolean) && (
        <div className="flex flex-wrap gap-2">
          {socials.github    && <SocialLink href={socials.github}                icon={<Github    size={12} />} label="GitHub"    />}
          {socials.instagram && <SocialLink href={socials.instagram}             icon={<Instagram size={12} />} label="Instagram" />}
          {socials.linkedin  && <SocialLink href={socials.linkedin}              icon={<Linkedin  size={12} />} label="LinkedIn"  />}
          {socials.website   && <SocialLink href={socials.website}               icon={<Globe     size={12} />} label="웹사이트"  />}
          {socials.email     && <SocialLink href={`mailto:${socials.email}`}     icon={<Mail      size={12} />} label="이메일"    />}
        </div>
      )}
    </div>
  );
}

function UrlCopyRow({ url, color }: { url: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
      <Globe size={12} className="text-white/30 shrink-0" />
      <span className="flex-1 text-xs text-white/50 truncate">{url}</span>
      <button onClick={copy}
        className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
        style={copied
          ? { backgroundColor: `${color}33`, color }
          : { color: "rgba(255,255,255,0.35)" }}>
        {copied ? "✓ 복사됨" : "복사"}
      </button>
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

function GalleryPanel({ data, isOwner, onSaved }: {
  data: UniverseData;
  isOwner: boolean;
  onSaved: (items: GalleryItem[]) => void;
}) {
  const [items, setItems] = useState<GalleryItem[]>(data.galleryItems ?? []);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sitePublic = data.published !== false; // 사이트 비공개면 항목 공개 불가

  // 비소유자: 사이트 공개 + 항목 공개인 것만 노출 (isPublic 미지정 구버전은 공개 취급)
  const visibleItems = isOwner
    ? items
    : sitePublic
      ? items.filter((it) => it.isPublic !== false)
      : [];

  const saveToDb = async (updated: GalleryItem[]) => {
    if (!data.personalId) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePersonal(data.personalId, { "universe.galleryItems": updated } as any);
      onSaved(updated);        // 부모 state 갱신
    } finally { setSaving(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !data.personalId) return;
    setUploading(true);
    try {
      const newItems: GalleryItem[] = [];
      for (const file of files) {
        const url = await uploadPersonalImage(data.personalId, "gallery", file);
        // 사이트 공개 상태면 기본 공개, 비공개면 비공개
        newItems.push({ url, isPublic: sitePublic });
      }
      const updated = [...items, ...newItems];
      setItems(updated);
      await saveToDb(updated);
    } catch { alert("업로드에 실패했습니다."); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const deleteByUrl = async (url: string) => {
    const updated = items.filter((it) => it.url !== url);
    setItems(updated);
    await saveToDb(updated);
  };

  const toggleByUrl = async (url: string) => {
    if (!sitePublic) return;
    const updated = items.map((it) => it.url === url ? { ...it, isPublic: !(it.isPublic !== false) } : it);
    setItems(updated);
    await saveToDb(updated);
  };

  const prevImg = () => setLightboxIdx((i) => (i !== null ? (i - 1 + visibleItems.length) % visibleItems.length : null));
  const nextImg = () => setLightboxIdx((i) => (i !== null ? (i + 1) % visibleItems.length : null));

  if (visibleItems.length === 0 && !isOwner) {
    return <div className="flex flex-col items-center py-8 text-white/30 text-sm gap-2"><ImageIcon size={28} />아직 공개된 사진이 없어요.</div>;
  }

  return (
    <>
      {items.length === 0 && isOwner ? (
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="w-full py-10 border-2 border-dashed border-white/15 rounded-2xl flex flex-col items-center gap-2 text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors">
          {uploading ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
          <span className="text-sm">사진 추가하기</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {visibleItems.map((item, i) => {
            const pub = item.isPublic !== false;
            return (
              <div key={item.url} className="relative aspect-square rounded-xl overflow-hidden group">
                <button onClick={() => setLightboxIdx(i)} className="w-full h-full">
                  <Image src={item.url} alt="" width={120} height={120} className="w-full h-full object-cover" />
                </button>
                {isOwner && (
                  <>
                    {/* 공개/비공개 토글 (좌상단) */}
                    <button onClick={() => toggleByUrl(item.url)} disabled={!sitePublic}
                      title={sitePublic ? (pub ? "공개됨 — 클릭해 비공개" : "비공개 — 클릭해 공개") : "사이트가 비공개입니다"}
                      className={cn("absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                        pub && sitePublic ? "bg-green-500/70" : "bg-black/60")}>
                      {pub && sitePublic ? <Globe size={10} className="text-white" /> : <Lock size={10} className="text-white" />}
                    </button>
                    {/* 삭제 (우상단) */}
                    <button onClick={() => deleteByUrl(item.url)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                      <X size={10} className="text-white" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
          {isOwner && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading || saving}
              className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors">
              {uploading || saving
                ? <Loader2 size={18} className="animate-spin text-violet-400" />
                : <><Plus size={20} /><span className="text-[10px] mt-1">추가</span></>}
            </button>
          )}
        </div>
      )}

      {isOwner && !sitePublic && items.length > 0 && (
        <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1"><Lock size={9} />사이트가 비공개라 모든 사진은 나만 볼 수 있어요.</p>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />

      {/* 라이트박스 */}
      {lightboxIdx !== null && visibleItems[lightboxIdx] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); prevImg(); }} className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft size={24} /></button>
          <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={visibleItems[lightboxIdx].url} alt="" width={1200} height={900} className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl" />
            <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs">{lightboxIdx + 1} / {visibleItems.length}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); nextImg(); }} className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight size={24} /></button>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><X size={20} /></button>
        </div>
      )}
    </>
  );
}

/* ─── AI 다이어리 패널 ─────────────────────────── */

const EMOTION_META: Record<DiaryEmotion, { emoji: string; label: string }> = {
  happy:    { emoji: "😊", label: "행복" },
  calm:     { emoji: "😌", label: "평온" },
  sad:      { emoji: "😢", label: "슬픔" },
  excited:  { emoji: "✨", label: "설렘" },
  tired:    { emoji: "😮‍💨", label: "지침" },
  grateful: { emoji: "🙏", label: "감사" },
  anxious:  { emoji: "😰", label: "불안" },
  neutral:  { emoji: "🌙", label: "평범" },
};

type DiaryView = "list" | "write" | "calendar";
type WriteMode = "text" | "chat";
interface ChatMsg { role: "ai" | "user"; text: string }

const DIARY_PAGE_SIZE = 5;
const FEATURED_LIMIT = 100; // 최신글 미리보기 글자수

function truncate(s: string, n: number) {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? flat.slice(0, n).trimEnd() + "…" : flat;
}

function DiaryPanel({ data, isOwner, onSaved }: {
  data: UniverseData;
  isOwner: boolean;
  onSaved: (entries: DiaryEntry[]) => void;
}) {
  const [entries, setEntries] = useState<DiaryEntry[]>(data.diaryEntries ?? []);
  const [view, setView] = useState<DiaryView>("list");
  const [mode, setMode] = useState<WriteMode>("text");
  const [page, setPage] = useState(0);
  const [dateQuery, setDateQuery] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modalEntries, setModalEntries] = useState<DiaryEntry[] | null>(null);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const sitePublic = data.published !== false;

  // 사이트가 공개일 때만 비소유자에게 공개 항목 노출
  const visibleEntries = isOwner ? entries : sitePublic ? entries.filter((e) => e.isPublic) : [];

  // 최신순 정렬
  const sorted = [...visibleEntries].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // 검색 필터 (날짜 + 키워드)
  const filtered = sorted.filter((e) => {
    if (dateQuery && e.date !== dateQuery) return false;
    if (keyword && !e.content.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  // 날짜별 그룹 (캘린더용)
  const byDate = new Map<string, DiaryEntry[]>();
  for (const e of visibleEntries) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }

  const saveToDb = async (updated: DiaryEntry[]) => {
    setEntries(updated);
    if (data.personalId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePersonal(data.personalId, { "universe.diaryEntries": updated } as any);
    }
    onSaved(updated);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("이 일기를 삭제할까요?")) return;
    const updated = entries.filter((e) => e.id !== id);
    await saveToDb(updated);
    // 모달 갱신 (남은 항목 없으면 닫기)
    setModalEntries((prev) => {
      if (!prev) return prev;
      const next = prev.filter((e) => e.id !== id);
      return next.length ? next : null;
    });
  };

  if (view === "write" && isOwner) {
    return (
      <DiaryWriter
        mode={mode}
        setMode={setMode}
        sitePublic={sitePublic}
        personalId={data.personalId}
        onCancel={() => setView("list")}
        onSave={async (entry) => {
          await saveToDb([entry, ...entries]);
          setPage(0);
          setView("list");
        }}
      />
    );
  }

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);
  const totalPages = Math.ceil(rest.length / DIARY_PAGE_SIZE);
  const pageItems = rest.slice(page * DIARY_PAGE_SIZE, page * DIARY_PAGE_SIZE + DIARY_PAGE_SIZE);
  const searching = !!(dateQuery || keyword);

  return (
    <div className="space-y-3">
      {/* 상단 바: 작성 + 캘린더 토글 */}
      <div className="flex items-center gap-2">
        {isOwner && view !== "calendar" && (
          <button onClick={() => { setMode("text"); setView("write"); }}
            className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 flex items-center justify-center gap-2 transition-colors">
            <PenLine size={14} />오늘 일기 쓰기
          </button>
        )}
        <button onClick={() => setView(view === "calendar" ? "list" : "calendar")}
          className={cn("px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border",
            view === "calendar" ? "bg-violet-500 text-white border-violet-500" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10",
            !isOwner && view !== "calendar" && "flex-1")}>
          {view === "calendar" ? <><BookOpen size={14} />목록</> : <><Calendar size={14} />캘린더</>}
        </button>
      </div>

      {/* ── 캘린더 뷰 ── */}
      {view === "calendar" ? (
        <DiaryCalendar month={calMonth} setMonth={setCalMonth} byDate={byDate} onPick={(es) => setModalEntries(es)} />
      ) : (
        <>
          {/* 검색 */}
          {visibleEntries.length > 0 && (
            <div className="flex items-center gap-2">
              <input type="date" value={dateQuery} onChange={(e) => { setDateQuery(e.target.value); setPage(0); }}
                className="px-2.5 py-2 rounded-lg bg-white/8 border border-white/15 text-xs text-white/80 focus:border-violet-400 focus:outline-none" />
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/8 border border-white/15 focus-within:border-violet-400">
                <Search size={12} className="text-white/30 shrink-0" />
                <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                  placeholder="키워드 검색"
                  className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder-white/25 focus:outline-none" />
              </div>
              {searching && (
                <button onClick={() => { setDateQuery(""); setKeyword(""); setPage(0); }}
                  className="text-xs text-white/40 hover:text-white/70 shrink-0">초기화</button>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-white/30 text-sm gap-2">
              <BookOpen size={28} />
              {searching ? "검색 결과가 없어요." : isOwner ? "첫 일기를 남겨보세요." : "아직 공개된 일기가 없어요."}
            </div>
          ) : (
            <>
              {/* 최신글 — 전체(100자) + 더보기 */}
              {featured && (() => {
                const em = EMOTION_META[featured.emotion ?? "neutral"];
                const long = featured.content.replace(/\s+/g, " ").trim().length > FEATURED_LIMIT;
                return (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{em.emoji}</span>
                      <span className="text-xs text-white/40">{featured.date}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">{em.label}</span>
                      {featured.mode === "chat" && <MessageCircle size={11} className="text-white/30" />}
                      {isOwner && (
                        <span className="ml-auto flex items-center gap-1.5">
                          {featured.isPublic ? <Globe size={11} className="text-green-400/70" /> : <Lock size={11} className="text-white/30" />}
                          <button onClick={() => deleteEntry(featured.id)} className="text-white/20 hover:text-red-400"><Trash2 size={12} /></button>
                        </span>
                      )}
                    </div>
                    <p className="text-white/75 text-sm leading-relaxed">{truncate(featured.content, FEATURED_LIMIT)}</p>
                    {featured.photos && featured.photos.length > 0 && (
                      <div className={cn("grid gap-1.5 mt-2", featured.photos.length === 1 ? "grid-cols-1" : featured.photos.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                        {featured.photos.map((url) => (
                          <div key={url} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image src={url} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    {long && (
                      <button onClick={() => setModalEntries([featured])} className="mt-1.5 text-xs font-semibold" style={{ color: data.color }}>
                        더보기
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* 나머지 — 한 줄 미리보기 */}
              {pageItems.map((e) => {
                const em = EMOTION_META[e.emotion ?? "neutral"];
                return (
                  <button key={e.id} onClick={() => setModalEntries([e])}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors text-left">
                    <span className="text-sm shrink-0">{em.emoji}</span>
                    <span className="text-[10px] text-white/35 shrink-0 w-[68px]">{e.date}</span>
                    <span className="text-xs text-white/70 truncate flex-1">{truncate(e.content, 60)}</span>
                  </button>
                );
              })}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="p-1.5 rounded-lg bg-white/5 text-white/50 disabled:opacity-30 hover:bg-white/10"><ChevronLeft size={14} /></button>
                  <span className="text-xs text-white/40">{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg bg-white/5 text-white/50 disabled:opacity-30 hover:bg-white/10"><ChevronRight size={14} /></button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 상세 모달 (더보기 / 캘린더 날짜 클릭) */}
      {modalEntries && (
        <DiaryDetailModal entries={modalEntries} isOwner={isOwner} color={data.color}
          onClose={() => setModalEntries(null)} onDelete={deleteEntry} />
      )}
    </div>
  );
}

/* ─── 다이어리 캘린더 ─────────────────────────── */

function DiaryCalendar({ month, setMonth, byDate, onPick }: {
  month: Date;
  setMonth: (d: Date) => void;
  byDate: Map<string, DiaryEntry[]>;
  onPick: (entries: DiaryEntry[]) => void;
}) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const startDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const fmt = (d: number) => `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => setMonth(new Date(year, m - 1, 1))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60"><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold text-white">{year}년 {m + 1}월</span>
        <button onClick={() => setMonth(new Date(year, m + 1, 1))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-white/30 mb-0.5">
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const es = byDate.get(fmt(d));
          const has = !!es && es.length > 0;
          const em = has ? EMOTION_META[es![0].emotion ?? "neutral"] : null;
          return (
            <button key={i} disabled={!has} onClick={() => has && onPick(es!)}
              className={cn("aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors",
                has ? "bg-violet-500/20 border border-violet-400/40 hover:bg-violet-500/35 cursor-pointer" : "cursor-default")}>
              <span className={cn("text-[10px] leading-none", has ? "text-white/80" : "text-white/25")}>{d}</span>
              {em && <span className="text-[11px] leading-none">{em.emoji}</span>}
              {has && es!.length > 1 && <span className="text-[7px] text-white/40 leading-none">{es!.length}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-white/25 text-center pt-1">일기가 있는 날을 누르면 내용이 보여요.</p>
    </div>
  );
}

/* ─── 다이어리 상세 모달 ──────────────────────── */

function DiaryDetailModal({ entries, isOwner, color, onClose, onDelete }: {
  entries: DiaryEntry[];
  isOwner: boolean;
  color: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 sticky top-0">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <span style={{ color }}>✦</span>{entries[0].date}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-5">
          {entries.map((e) => {
            const em = EMOTION_META[e.emotion ?? "neutral"];
            return (
              <div key={e.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{em.emoji}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">{em.label}</span>
                  {e.mode === "chat" && <MessageCircle size={11} className="text-white/30" />}
                  {isOwner && (
                    <span className="ml-auto flex items-center gap-1.5">
                      {e.isPublic ? <Globe size={11} className="text-green-400/70" /> : <Lock size={11} className="text-white/30" />}
                      <button onClick={() => onDelete(e.id)} className="text-white/20 hover:text-red-400"><Trash2 size={13} /></button>
                    </span>
                  )}
                </div>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{e.content}</p>
                {e.photos && e.photos.length > 0 && (
                  <div className={cn("grid gap-2 mt-3", e.photos.length === 1 ? "grid-cols-1" : e.photos.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                    {e.photos.map((url) => (
                      <div key={url} className="relative aspect-square rounded-xl overflow-hidden">
                        <Image src={url} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── 다이어리 작성기 (일기형 / 대화형) ───────── */

function DiaryWriter({ mode, setMode, sitePublic, personalId, onCancel, onSave }: {
  mode: WriteMode;
  setMode: (m: WriteMode) => void;
  sitePublic: boolean;
  personalId?: string;
  onCancel: () => void;
  onSave: (entry: DiaryEntry) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", text: "오늘 하루는 어땠어요? 편하게 들려주세요 🌙" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !personalId) return;
    if (photos.length >= 3) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadPersonalImage(personalId, "diary", file);
      setPhotos((p) => [...p, url]);
    } catch { alert("사진 업로드에 실패했습니다."); }
    finally { setUploadingPhoto(false); e.target.value = ""; }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiThinking]);

  const sendChat = async () => {
    const t = chatInput.trim();
    if (!t || aiThinking) return;
    const next = [...messages, { role: "user" as const, text: t }];
    setMessages(next);
    setChatInput("");
    setAiThinking(true);
    try {
      const res = await fetch("/api/personal/diary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", messages: next }),
      });
      const data = await res.json();
      if (data.reply) setMessages((p) => [...p, { role: "ai", text: data.reply }]);
    } catch { /* 무시 */ }
    finally { setAiThinking(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/personal/diary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "chat"
            ? { action: "finalize", mode, messages }
            : { action: "finalize", mode, text }
        ),
      });
      const data = await res.json();
      if (data.error) { alert("일기 정리에 실패했습니다."); return; }
      const entry: DiaryEntry = {
        id: `d_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        mode,
        content: data.content,
        emotion: data.emotion,
        isPublic: sitePublic ? isPublic : false,
        createdAt: new Date().toISOString(),
        ...(photos.length > 0 && { photos }),
      };
      await onSave(entry);
    } finally { setSaving(false); }
  };

  const canSave = mode === "text" ? text.trim().length > 0 : messages.some((m) => m.role === "user");

  return (
    <div className="flex flex-col h-full min-h-[360px]">
      {/* 모드 토글 */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-3 shrink-0">
        {([["text", "일기형", <PenLine key="p" size={13} />], ["chat", "대화형", <MessageCircle key="c" size={13} />]] as const).map(([m, label, icon]) => (
          <button key={m} onClick={() => setMode(m)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors",
              mode === m ? "bg-violet-500 text-white" : "text-white/40 hover:text-white/70")}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* 본문 */}
      {mode === "text" ? (
        <textarea value={text} onChange={(e) => setText(e.target.value)} autoFocus
          rows={8} placeholder="오늘 있었던 일, 느낀 감정을 자유롭게 적어보세요. AI가 감성적인 일기로 다듬어드려요."
          className="flex-1 w-full px-3.5 py-3 rounded-xl bg-white/8 border border-white/15 text-sm text-white placeholder-white/25 focus:border-violet-400 focus:outline-none resize-none" />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[200px] max-h-[300px]">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "ai" ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
                m.role === "ai" ? "bg-white/10 text-white/80 rounded-tl-sm" : "bg-violet-500 text-white rounded-tr-sm")}>
                {m.text}
              </div>
            </div>
          ))}
          {aiThinking && (
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white/10">
                <Loader2 size={14} className="animate-spin text-white/50" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 대화형 입력창 */}
      {mode === "chat" && (
        <div className="flex items-center gap-2 mt-2 shrink-0">
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="답장을 입력하세요..."
            className="flex-1 px-3.5 py-2.5 rounded-full bg-white/8 border border-white/15 text-sm text-white placeholder-white/25 focus:border-violet-400 focus:outline-none" />
          <button onClick={sendChat} disabled={aiThinking || !chatInput.trim()}
            className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 disabled:opacity-40 shrink-0">
            <Send size={15} />
          </button>
        </div>
      )}

      {/* 사진 첨부 (최대 3장) */}
      {personalId && (
        <div className="mt-3 shrink-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <ImageIcon size={11} className="text-white/40" />
            <span className="text-xs text-white/40">사진 첨부</span>
            <span className="text-[10px] text-white/25">{photos.length}/3</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {photos.map((url, i) => (
              <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image src={url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                <button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors">
                  <X size={9} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                className="w-16 h-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors shrink-0">
                {uploadingPhoto ? <Loader2 size={15} className="animate-spin text-violet-400" /> : <Plus size={15} />}
              </button>
            )}
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>
      )}

      {/* 공개/비공개 + 저장 */}
      <div className="mt-3 pt-3 border-t border-white/10 shrink-0 space-y-2.5">
        <label className={cn("flex items-center gap-2", sitePublic ? "cursor-pointer" : "opacity-40 cursor-not-allowed")}>
          <div onClick={() => sitePublic && setIsPublic((v) => !v)}
            className={cn("w-9 h-5 rounded-full transition-colors relative", isPublic && sitePublic ? "bg-violet-500" : "bg-white/20")}>
            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", isPublic && sitePublic ? "translate-x-4" : "translate-x-0.5")} />
          </div>
          <span className="text-xs text-white/60 flex items-center gap-1">
            {isPublic && sitePublic ? <Globe size={11} /> : <Lock size={11} />}
            {sitePublic ? (isPublic ? "방문자에게 공개" : "나만 보기") : "사이트가 비공개라 공개 불가"}
          </span>
        </label>
        <div className="flex gap-2">
          <button onClick={save} disabled={!canSave || saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "AI가 일기로 정리 중..." : "저장"}
          </button>
          <button onClick={onCancel} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/15">취소</button>
        </div>
      </div>
    </div>
  );
}

/* ─── 메뉴 콘텐츠 ──────────────────────────────── */

function MenuContent({ menu, data, isOwner, onDataUpdate }: {
  menu: UniverseMenu;
  data: UniverseData;
  isOwner: boolean;
  onDataUpdate: (u: Partial<UniverseData>) => void;
}) {
  switch (menu.icon) {
    case "profile": return (
      <ProfilePanel data={data} isOwner={isOwner}
        onSaved={(u) => onDataUpdate({ role: u.role, tagline: u.tagline, about: u.about, photo: u.photo })} />
    );
    case "gallery": return (
      <GalleryPanel data={data} isOwner={isOwner}
        onSaved={(items) => onDataUpdate({ galleryItems: items })} />
    );
    case "diary": return (
      <DiaryPanel data={data} isOwner={isOwner}
        onSaved={(entries) => onDataUpdate({ diaryEntries: entries })} />
    );
    case "link":    return <p className="text-white/50 text-sm py-4 text-center">링크 모음은 곧 추가됩니다.</p>;
    case "music":   return <p className="text-white/50 text-sm py-4 text-center">음악 공간은 곧 추가됩니다.</p>;
    case "note":    return <p className="text-white/50 text-sm py-4 text-center">메모 공간은 곧 추가됩니다.</p>;
    default: return null;
  }
}

/* ─── 별 방명록 ─────────────────────────────────── */

function StarComments({ starName, currentUser, isOwner }: {
  starName: string;
  currentUser: { uid: string; displayName?: string | null; email?: string | null } | null;
  isOwner: boolean;
}) {
  const [comments, setComments] = useState<StarComment[] | null>(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setComments(null);
    // 내 스페이스: 전체 댓글 / 타인 스페이스: 공개 댓글만
    const fetch = isOwner ? getStarComments(starName) : getPublicStarComments(starName);
    fetch.then((c) => { if (!cancelled) setComments(c); }).catch(() => setComments([]));
    return () => { cancelled = true; };
  }, [starName, isOwner]);

  const post = async () => {
    if (!currentUser || !text.trim() || posting) return;
    const authorName = currentUser.displayName || currentUser.email?.split("@")[0] || "익명";
    const payload = { authorId: currentUser.uid, authorName, text: text.trim(), isPublic };
    setPosting(true);
    try {
      const id = await addStarComment(starName, payload);
      const newC: StarComment = { id, ...payload, createdAt: new Date().toISOString() };
      setComments((prev) => [...(prev ?? []), newC]);
      setText("");
    } catch { /* 무시 */ }
    finally { setPosting(false); }
  };

  const remove = async (commentId: string, authorId: string) => {
    if (!currentUser || currentUser.uid !== authorId) return;
    await deleteStarComment(starName, commentId).catch(() => {});
    setComments((prev) => prev?.filter((c) => c.id !== commentId) ?? null);
  };

  const toggleVisibility = async (commentId: string, current: boolean) => {
    await updateStarCommentVisibility(starName, commentId, !current).catch(() => {});
    setComments((prev) => prev?.map((c) => c.id === commentId ? { ...c, isPublic: !current } : c) ?? null);
  };

  const publicCount = comments?.filter((c) => c.isPublic).length ?? 0;

  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <p className="text-[11px] text-white/35 mb-3 flex items-center gap-1.5">
        <MessageCircle size={11} />이 별을 공유하는 사람들의 이야기
        {comments !== null && <span>({isOwner ? comments.length : publicCount})</span>}
      </p>

      {/* 댓글 목록 */}
      <div className="space-y-2.5 max-h-44 overflow-y-auto mb-3 pr-1">
        {comments === null && (
          <div className="flex justify-center py-4"><Loader2 size={14} className="animate-spin text-white/25" /></div>
        )}
        {comments?.length === 0 && (
          <p className="text-xs text-white/25 text-center py-3">첫 번째 이야기를 남겨보세요 ✨</p>
        )}
        {comments?.map((c) => (
          <div key={c.id} className="flex items-start gap-2 group">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-white/60 mt-0.5">
              {c.authorName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-[10px] text-white/40 font-medium">{c.authorName}</span>
                <span className="text-[9px] text-white/20">
                  {new Date(c.createdAt).toLocaleDateString("ko", { month: "short", day: "numeric" })}
                </span>
                {/* 공개 여부 뱃지 — 내 스페이스에서만 표시 */}
                {isOwner && currentUser?.uid === c.authorId && (
                  <button
                    onClick={() => toggleVisibility(c.id, c.isPublic)}
                    className={cn("text-[9px] px-1.5 py-0.5 rounded-full border transition-colors",
                      c.isPublic
                        ? "border-violet-400/50 text-violet-300 bg-violet-500/10"
                        : "border-white/15 text-white/25 hover:border-white/30"
                    )}>
                    {c.isPublic ? "공개" : "비공개"}
                  </button>
                )}
              </div>
              <p className="text-xs text-white/75 leading-relaxed break-words">{c.text}</p>
            </div>
            {currentUser?.uid === c.authorId && (
              <button onClick={() => remove(c.id, c.authorId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-400 shrink-0">
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 입력 */}
      {currentUser ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && post()}
              placeholder="이 별에 메시지를 남겨보세요..."
              maxLength={120}
              className="flex-1 px-3 py-2 rounded-full bg-white/8 border border-white/15 text-xs text-white placeholder-white/25 focus:border-violet-400 focus:outline-none"
            />
            <button onClick={post} disabled={posting || !text.trim()}
              className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center hover:bg-violet-600 disabled:opacity-40 transition-colors shrink-0">
              {posting ? <Loader2 size={12} className="animate-spin text-white" /> : <Send size={12} className="text-white" />}
            </button>
          </div>
          {/* 공개 여부 토글 */}
          <button
            onClick={() => setIsPublic((v) => !v)}
            className={cn("flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border transition-colors",
              isPublic
                ? "border-violet-400/50 text-violet-300 bg-violet-500/10"
                : "border-white/15 text-white/30 hover:border-white/25"
            )}>
            {isPublic ? "🌐 공개 — 이 별을 공유하는 모든 우주에 보여요" : "🔒 비공개 — 내 우주에서만 보여요"}
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-white/30 text-center">
          <a href="/login" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">로그인</a>하면 이야기를 남길 수 있어요
        </p>
      )}
    </div>
  );
}

/* ─── 로그인 유도 모달 ─────────────────────────── */

function LoginPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-sm bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-7 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={24} className="text-violet-400" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">당신만의 별자리 우주</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          이 기능은 로그인 후 이용할 수 있어요.<br />
          지금 바로 나만의 우주를 만들어보세요.
        </p>
        <div className="flex flex-col gap-2">
          <a href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-violet-500 text-white font-bold hover:bg-violet-600 transition-colors">
            <LogIn size={16} />로그인
          </a>
          <a href="/signup"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/10 text-white/80 font-semibold hover:bg-white/15 transition-colors">
            회원가입 (무료)
          </a>
          <button onClick={onClose} className="text-white/30 text-sm mt-1 hover:text-white/50">
            구경만 할게요
          </button>
        </div>
      </div>
    </div>
  );
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

/* ─── BGM 플레이어 버튼 (다중 트랙) ─────────────── */

function BgmPlayerButton({ tracks, trackIdx, color, playing, onToggle, onPrev, onNext, onVolumeChange }: {
  tracks: BgmTrack[];
  trackIdx: number;
  color: string;
  playing: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (vol: number) => void;
}) {
  const [showVol, setShowVol] = useState(false);
  const track = tracks[trackIdx];
  if (!track) return null;
  const vol = track.volume ?? 1;
  return (
    <div className="relative">
      {showVol && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-sm flex items-center gap-2 whitespace-nowrap">
          <Volume2 size={11} className="text-white/40 shrink-0" />
          <input
            type="range" min="0" max="100"
            value={Math.round(vol * 100)}
            onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
            className="w-24 accent-violet-400 cursor-pointer"
            style={{ height: "4px" }}
          />
          <span className="text-[10px] text-white/40 w-7 text-right tabular-nums">{Math.round(vol * 100)}%</span>
        </div>
      )}
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-sm border text-white/70 text-xs"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
        {tracks.length > 1 && (
          <button onClick={onPrev} className="p-0.5 hover:text-white transition-colors" title="이전 트랙">
            <ChevronLeft size={12} />
          </button>
        )}
        <button onClick={onToggle} className="p-0.5 hover:text-white transition-colors" title={track.name}>
          {playing ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <span className="max-w-[90px] truncate mx-1">{track.name}</span>
        {tracks.length > 1 && (
          <button onClick={onNext} className="p-0.5 hover:text-white transition-colors" title="다음 트랙">
            <ChevronRight size={12} />
          </button>
        )}
        <button onClick={() => setShowVol((v) => !v)}
          className={cn("p-0.5 transition-colors", showVol ? "text-violet-400" : "hover:text-white")}
          title="볼륨">
          <Volume2 size={12} />
        </button>
      </div>
    </div>
  );
}

/* ─── 메인 컴포넌트 ────────────────────────────── */

/* UI 텍스트 정적 번역 */
const UI = {
  ko: { constellationOf: "Constellation of", suffix: "님의 별자리", neighbor: "랜덤 이웃 구경", backTo: "내 우주로", settings: "설정" },
  en: { constellationOf: "Constellation of", suffix: "'s Universe",  neighbor: "Visit Neighbors",  backTo: "My Universe", settings: "Settings" },
} as const;

const DEFAULT_MENUS: UniverseMenu[] = [
  { id: "profile", label: "내 소개",  icon: "profile" },
  { id: "diary",   label: "다이어리", icon: "diary"   },
  { id: "gallery", label: "갤러리",   icon: "gallery" },
];

export function UniverseHome({ data: initialData }: { data: UniverseData }) {
  const [data, setData] = useState(initialData);
  // DB에 시드가 저장돼 있으면 그걸 그대로 사용 (불변) — 없으면 name+color+number로 생성 (구버전 호환)
  const constellation = data.constellationSeed != null
    ? generateConstellationFromSeed(data.constellationSeed, data.color)
    : generateConstellation(data.name, data.color, data.favoriteNumber);
  const [openMenu, setOpenMenu] = useState<UniverseMenu | null>(null);
  const [showNeighbors, setShowNeighbors] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPrivateNotice, setShowPrivateNotice] = useState(false);
  const [clickedStar, setClickedStar] = useState<ConstellationStar | null>(null);

  // 로그인 없이 열람 가능한 메뉴
  const PUBLIC_MENUS: UniverseIconType[] = ["profile", "gallery"];

  const handleMenuClick = (menu: UniverseMenu) => {
    // 사이트가 비공개인데 소유자가 아니면 진입 차단
    if (data.published === false && !isOwner) {
      setShowPrivateNotice(true);
      return;
    }
    if (!user && !PUBLIC_MENUS.includes(menu.icon)) {
      setShowLoginPrompt(true);
      return;
    }
    setOpenMenu(menu);
  };

  const handleNeighborClick = () => {
    if (!user) { setShowLoginPrompt(true); return; }
    setShowNeighbors(true);
  };
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from") ?? undefined;

  const { user } = useAuthStore();

  // ── BGM 다중 트랙 관리 ──────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);

  const bgmList = data.bgmList ?? [];
  const currentTrack = bgmList[trackIdx] ?? null;

  useEffect(() => {
    if (!currentTrack?.url) {
      audioRef.current?.pause();
      audioRef.current = null;
      setBgmPlaying(false);
      return;
    }
    if (audioRef.current && audioRef.current.src !== currentTrack.url) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
      setBgmPlaying(false);
    }
    if (!audioRef.current) {
      const audio = new Audio(currentTrack.url);
      audio.loop = true;
      audio.volume = currentTrack.volume ?? 1;
      audioRef.current = audio;
    }
    if (currentTrack.autoPlay) {
      audioRef.current.play().then(() => setBgmPlaying(true)).catch(() => {});
    }
    return () => { audioRef.current?.pause(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.url, currentTrack?.autoPlay]);

  // 볼륨 설정 변경 즉시 반영
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = currentTrack?.volume ?? 1;
  }, [currentTrack?.volume]);

  const toggleBgm = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (bgmPlaying) { audio.pause(); setBgmPlaying(false); }
    else { audio.play().then(() => setBgmPlaying(true)).catch(() => {}); }
  };

  const prevTrack = () => {
    if (bgmList.length < 2) return;
    setTrackIdx((i) => (i - 1 + bgmList.length) % bgmList.length);
    audioRef.current?.pause();
    audioRef.current = null;
    setBgmPlaying(false);
  };

  const nextTrack = () => {
    if (bgmList.length < 2) return;
    setTrackIdx((i) => (i + 1) % bgmList.length);
    audioRef.current?.pause();
    audioRef.current = null;
    setBgmPlaying(false);
  };
  const isOwner = !!user && !!data.ownerId && user.uid === data.ownerId;

  // menus가 DB에 없는 경우(구버전 계정) 기본값으로 자동 복구
  useEffect(() => {
    if (isOwner && data.personalId && (!data.menus || data.menus.length === 0)) {
      setData((prev) => ({ ...prev, menus: DEFAULT_MENUS }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatePersonal(data.personalId, { "universe.menus": DEFAULT_MENUS } as any).catch(console.error);
    }
  // 마운트 시 한 번만
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, data.personalId]);

  // [보안] SSR은 공개 콘텐츠만 전송 → 소유자 확인되면 비공개 콘텐츠를 클라이언트에서 추가 로드
  const [privateLoaded, setPrivateLoaded] = useState(false);
  useEffect(() => {
    if (!isOwner || !data.personalId || privateLoaded) return;
    let cancelled = false;
    getPersonalById(data.personalId).then((full) => {
      if (cancelled || !full) return;
      setData((prev) => ({
        ...prev,
        about:        full.about || full.profile.bio || prev.about,
        photo:        full.profile.photo ?? prev.photo,
        tagline:      full.profile.tagline ?? prev.tagline,
        role:         full.profile.role ?? prev.role,
        socials:      full.profile.socials ?? prev.socials,
        galleryItems: full.universe?.galleryItems ?? prev.galleryItems,
        diaryEntries: full.universe?.diaryEntries ?? prev.diaryEntries,
      }));
      setPrivateLoaded(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, data.personalId, privateLoaded]);

  // 다국어
  const { lang, setLang } = useLang();
  const [langLoading, setLangLoading] = useState(false);
  const [transCache, setTransCache] = useState<Record<string, { about: string; tagline: string; role: string }>>({});

  // 현재 표시할 번역된 콘텐츠 (라이브 data 기준 — 소유자 비공개 재로딩 반영)
  const displayed = transCache[lang] ?? { about: data.about ?? "", tagline: data.tagline ?? "", role: data.role ?? "" };

  const switchLang = async (target: typeof lang) => {
    if (target === lang || langLoading) return;
    setLang(target);
    if (target === "ko" || transCache[target]) return;
    setLangLoading(true);
    try {
      const texts = collectUniverseTexts(data.about ?? "", data.tagline ?? "", data.role ?? "");
      const translations = await fetchTranslations(texts, target);
      const applied = applyUniverseTexts(translations);
      setTransCache((c) => ({ ...c, [target]: applied }));
    } catch { /* 원문 유지 */ }
    finally { setLangLoading(false); }
  };

  const ui = UI[lang];

  const style = data.style ?? {};

  // ── 뷰포트 감지 (모바일 < 768px) ────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 설정 저장 후 로컬 상태 갱신
  const handleSettingsSaved = (state: {
    selectedAssets: string[];
    bgmList: BgmTrack[];
    menus: UniverseMenu[];
    menuLayout: Record<string, { top: string; left: string }>;
    menuLayoutMobile: Record<string, { top: string; left: string }>;
    assetPositions: Record<string, { top: string; left: string }>;
    assetPositionsMobile: Record<string, { top: string; left: string }>;
  }) => {
    setData((prev) => ({
      ...prev,
      selectedAssets: state.selectedAssets,
      bgmList: state.bgmList,
      menus: state.menus,
      menuLayout:         Object.keys(state.menuLayout).length         > 0 ? state.menuLayout         : undefined,
      menuLayoutMobile:   Object.keys(state.menuLayoutMobile).length   > 0 ? state.menuLayoutMobile   : undefined,
      assetPositions:     Object.keys(state.assetPositions).length     > 0 ? state.assetPositions     : undefined,
      assetPositionsMobile: Object.keys(state.assetPositionsMobile).length > 0 ? state.assetPositionsMobile : undefined,
    }));
    setTrackIdx((i) => Math.min(i, Math.max(0, state.bgmList.length - 1)));
  };

  // 현재 뷰포트에 맞는 메뉴/에셋 위치
  const activeMenuLayout    = isMobile ? (data.menuLayoutMobile    ?? data.menuLayout)    : data.menuLayout;
  const activeAssetPositions = isMobile ? (data.assetPositionsMobile ?? data.assetPositions) : data.assetPositions;

  const getMenuPos = (menuId: string, idx: number) =>
    activeMenuLayout?.[menuId] ?? DEFAULT_POS[idx] ?? { top: "50%", left: "50%" };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05060f]">
      <StarfieldCanvas
        constellation={constellation}
        skyTheme={style.skyTheme ?? "deep-space"}
        lineStyle={style.lineStyle ?? "flow"}
        starGlow={style.starGlow ?? "default"}
        shootingStarIntervalMs={(data.shootingStarIntervalSec ?? 10) * 1000}
        onStarClick={(star) => {
          if (!openMenu && !showNeighbors && !showSettings) setClickedStar(star);
        }}
      />

      {/* 떠다니는 에셋 */}
      {data.selectedAssets && data.selectedAssets.length > 0 && (
        <FloatingAssets
          selectedIds={data.selectedAssets}
          seed={constellation.seed}
          customPositions={activeAssetPositions}
          profilePhotoUrl={data.photo}
        />
      )}

      {/* ← 이전 우주로 돌아가기 */}
      {fromId && (
        <a href={`/p/${fromId}`}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/70 text-xs font-medium hover:bg-black/50 hover:text-white transition-colors">
          <ChevronLeft size={14} />{ui.backTo}
        </a>
      )}

      {/* 우상단: 언어 토글 + 설정/로그인 버튼 */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LangToggle lang={lang} loading={langLoading} onSwitch={switchLang} theme="dark" />
        {user && (
          <Link href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/50 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
            <Sparkles size={13} />우주 탐험
          </Link>
        )}
        {isOwner && (
          <button onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/50 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
            <Settings size={13} />{ui.settings}
          </button>
        )}
        {!user && (
          <a href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
            <LogIn size={13} />로그인
          </a>
        )}
      </div>

      {/* 별자리 이름 — 모바일: 하단 버튼 위, 데스크탑: 중앙 */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 text-center pointer-events-none z-10",
        isMobile
          ? "bottom-32 px-4 w-full"
          : "top-1/2 -translate-y-1/2"
      )}>
        <p className={cn("uppercase tracking-[0.25em] mb-1", isMobile ? "text-[10px]" : "text-xs")}
          style={{ color: data.color }}>{ui.constellationOf}</p>
        <h1 className={cn("font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]",
          isMobile ? "text-xl" : "text-2xl md:text-3xl")}>
          {data.name}<span className="text-white/60">{ui.suffix}</span>
        </h1>
      </div>

      {/* 메뉴 노드 — 위치는 menuLayout 우선 */}
      {(data.menus ?? []).slice(0, 6).map((menu, i) => {
        const pos = getMenuPos(menu.id, i);
        const isPublic = PUBLIC_MENUS.includes(menu.icon);
        return (
          <button key={menu.id} onClick={() => handleMenuClick(menu)}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: pos.top, left: pos.left }}>
            <span className="flex flex-col items-center gap-2">
              <span className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm border transition-transform group-hover:scale-110 relative"
                style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}88`, color: "#fff", boxShadow: `0 0 20px ${data.color}55` }}>
                {menu.customIcon
                  ? (menu.customIcon.startsWith("http") || menu.customIcon.startsWith("/"))
                    ? <img src={menu.customIcon} alt="" className="w-5 h-5 rounded-full object-cover" />
                    : <span className="text-xl leading-none">{menu.customIcon}</span>
                  : ICON[menu.icon]}
                {/* 비로그인 + 제한 메뉴에 자물쇠 뱃지 */}
                {!user && !isPublic && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]">🔒</span>
                )}
              </span>
              <span className="text-xs font-medium text-white/80">{menu.label}</span>
            </span>
          </button>
        );
      })}

      {/* 비소유자 전용: 메인 복귀 + 별자리 만들기 */}
      {!isOwner && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <Link href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-sm border border-white/15 bg-black/40 text-white/55 text-xs font-medium hover:bg-black/60 hover:text-white transition-colors whitespace-nowrap">
            <ChevronLeft size={12} />우주 탐험으로
          </Link>
          {user && data.personalId && (
            <SaveConstellationButton
              targetId={data.personalId}
              targetName={data.name}
              targetColor={data.color}
              targetSeed={data.constellationSeed}
              viewerUid={user.uid}
            />
          )}
          <a href={user ? "/private/create/universe" : "/signup"}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-sm border border-violet-400/40 bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/35 hover:text-white transition-colors whitespace-nowrap">
            <Sparkles size={12} />나만의 별자리 만들기
          </a>
        </div>
      )}

      {/* 하단 액션 + BGM 플레이어 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {bgmList.length > 0 && (
          <BgmPlayerButton
            tracks={bgmList}
            trackIdx={trackIdx}
            color={data.color}
            playing={bgmPlaying}
            onToggle={toggleBgm}
            onPrev={prevTrack}
            onNext={nextTrack}
            onVolumeChange={(vol) => {
              if (audioRef.current) audioRef.current.volume = vol;
              setData((prev) => ({
                ...prev,
                bgmList: (prev.bgmList ?? []).map((t, i) => i === trackIdx ? { ...t, volume: vol } : t),
              }));
            }}
          />
        )}
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white backdrop-blur-sm border transition-colors hover:bg-white/10"
          style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}66` }}
          onClick={handleNeighborClick}>
          <Sparkles size={14} />{ui.neighbor}
        </button>
        <ShareButton url={data.publicUrl || (data.personalId ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${data.personalId}` : "")} color={data.color} />
      </div>

      {/* 메뉴 패널 */}
      {openMenu && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpenMenu(null)}>
          <div className="w-full sm:max-w-md bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 m-0 sm:m-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <span style={{ color: data.color }}>
                  {openMenu.customIcon
                    ? (openMenu.customIcon.startsWith("http") || openMenu.customIcon.startsWith("/"))
                      ? <img src={openMenu.customIcon} alt="" className="w-6 h-6 rounded-full object-cover" />
                      : <span className="text-lg">{openMenu.customIcon}</span>
                    : ICON[openMenu.icon]}
                </span>
                <h2 className="font-bold text-lg">{openMenu.label}</h2>
              </div>
              <button onClick={() => setOpenMenu(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-[80px]">
              <MenuContent
                menu={openMenu}
                data={{ ...data, about: displayed.about, tagline: displayed.tagline, role: displayed.role }}
                isOwner={isOwner}
                onDataUpdate={(u) => setData((prev) => ({ ...prev, ...u }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* 이웃 구경 모달 */}
      {showNeighbors && <NeighborModal onClose={() => setShowNeighbors(false)} fromId={data.personalId} />}

      {/* 로그인 유도 모달 */}
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}

      {/* 비공개 우주 안내 */}
      {showPrivateNotice && (
        <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPrivateNotice(false)}>
          <div className="w-full sm:max-w-sm bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-7 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-4">
              <Lock size={22} className="text-white/60" />
            </div>
            <h2 className="text-white font-bold text-lg mb-2">비공개 우주예요</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              이 별자리의 주인이 우주를 비공개로 설정했어요.<br />
              별자리는 볼 수 있지만 내용은 열람할 수 없어요.
            </p>
            <button onClick={() => setShowPrivateNotice(false)}
              className="w-full py-3 rounded-2xl bg-white/10 text-white/80 font-semibold hover:bg-white/15 transition-colors">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 별 클릭 설명 모달 */}
      {clickedStar && (() => {
        const lore = getStarLore(clickedStar.star.name);
        return (
          <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center"
            onClick={() => setClickedStar(null)}>
            <div className="w-full sm:max-w-sm mx-auto bg-black/50 backdrop-blur-xl border border-white/10 rounded-t-3xl sm:rounded-3xl p-7 m-0 sm:m-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              {/* 별 아이콘 + 밝기 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${data.color}22`, boxShadow: `0 0 24px ${data.color}66` }}>
                  <span className="text-white text-xl">✦</span>
                </div>
                <div>
                  <p className="text-white font-bold text-base">{clickedStar.star.name}</p>
                  <p className="text-white/40 text-xs">등급 {clickedStar.star.mag.toFixed(2)} · {lore.title}</p>
                </div>
                <button onClick={() => setClickedStar(null)} className="ml-auto text-white/30 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{lore.desc}</p>
              <StarNeighbors starName={clickedStar.star.name} excludeId={data.personalId} color={data.color} />
              <StarComments starName={clickedStar.star.name} currentUser={user} isOwner={isOwner} />
            </div>
          </div>
        );
      })()}

      {/* 설정 패널 */}
      {showSettings && data.personalId && (
        <UniverseSettings
          personalId={data.personalId}
          menus={data.menus ?? []}
          initialAssets={data.selectedAssets ?? []}
          initialBgmList={bgmList}
          initialLayout={data.menuLayout}
          initialLayoutMobile={data.menuLayoutMobile}
          initialAssetPositions={data.assetPositions}
          initialAssetPositionsMobile={data.assetPositionsMobile}
          allAssets={DEFAULT_ASSETS}
          profilePhotoUrl={data.photo}
          bgmPlaying={bgmPlaying}
          onToggleBgm={toggleBgm}
          onClose={() => setShowSettings(false)}
          initialColor={data.color}
          onSaved={(s) => {
            handleSettingsSaved(s);
            if (s.color !== data.color) setData((prev) => ({ ...prev, color: s.color }));
          }}
        />
      )}
    </div>
  );
}

/* ─── 퍼가기 버튼 ──────────────────────────────── */

function ShareButton({ url, color }: { url: string; color: string }) {
  const [copied, setCopied] = useState(false);
  if (!url) return null;

  const handleShare = async () => {
    // 모바일: Web Share API 우선
    if (navigator.share) {
      try {
        await navigator.share({ title: "내 별자리 우주", url });
        return;
      } catch { /* 취소하면 무시 */ }
    }
    // 데스크탑: 클립보드 복사
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white backdrop-blur-sm border transition-colors"
      style={{ backgroundColor: copied ? `${color}33` : `${color}22`, borderColor: `${color}66` }}
    >
      {copied ? <Check size={15} /> : <Send size={15} />}
      {copied ? "복사됨" : "퍼가기"}
    </button>
  );
}

/* ─── 이 별을 가진 이웃 유저 ───────────────────── */

function StarNeighbors({ starName, excludeId, color }: {
  starName: string;
  excludeId?: string;
  color: string;
}) {
  const [neighbors, setNeighbors] = useState<Array<{ personalId: string; name: string; color: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStarNeighbors(starName, excludeId ?? "", 3)
      .then(setNeighbors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [starName, excludeId]);

  if (loading) return (
    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
      <Loader2 size={12} className="animate-spin text-white/30" />
      <span className="text-white/30 text-xs">이 별의 이웃 찾는 중...</span>
    </div>
  );

  if (neighbors.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3">이 별을 가진 우주</p>
      <div className="flex flex-col gap-2">
        {neighbors.map((n) => (
          <a key={n.personalId} href={`/p/${n.personalId}`}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${n.color}30`, boxShadow: `0 0 8px ${n.color}44` }}>
              <span className="text-white text-xs">✦</span>
            </div>
            <span className="text-white/70 text-sm font-medium">{n.name}</span>
            <ArrowRight size={12} className="ml-auto text-white/30" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── 별자리 친구 추가 버튼 ─────────────────────── */

function SaveConstellationButton({ targetId, targetName, targetColor, targetSeed, viewerUid }: {
  targetId: string;
  targetName: string;
  targetColor: string;
  targetSeed?: number;
  viewerUid: string;
}) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPersonalsByOwner(viewerUid).then((pages) => {
      const myPage = pages.find((p) => p.universe);
      const already = myPage?.universe?.savedConstellations?.some((s) => s.id === targetId);
      if (already) setSaved(true);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, viewerUid]);

  const handleSave = async () => {
    if (saved || loading) return;
    setLoading(true);
    try {
      const pages = await getPersonalsByOwner(viewerUid);
      const myPage = pages.find((p) => p.universe);
      if (!myPage) return;
      const existing = myPage.universe?.savedConstellations ?? [];
      if (existing.some((s) => s.id === targetId)) { setSaved(true); return; }
      const updated = [...existing, {
        id: targetId,
        name: targetName,
        color: targetColor,
        constellationSeed: targetSeed,
        savedAt: new Date().toISOString(),
      }];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePersonal(myPage.id, { "universe.savedConstellations": updated } as any);
      setSaved(true);
    } catch { /* 실패 무시 */ }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saved || loading}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full backdrop-blur-sm border text-xs font-medium transition-colors whitespace-nowrap"
      style={saved
        ? { backgroundColor: `${targetColor}30`, borderColor: `${targetColor}60`, color: targetColor }
        : { backgroundColor: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }
      }
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} fill={saved ? "currentColor" : "none"} />}
      {saved ? "저장됨" : "별자리 저장"}
    </button>
  );
}
