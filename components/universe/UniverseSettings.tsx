"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { updatePersonal, saveCustomAssets, saveCountry } from "@/lib/firebase/personals";
import { uploadPersonalAudio, uploadPersonalImage, uploadPersonalAsset } from "@/lib/firebase/storage";
import { DEFAULT_ASSETS } from "@/lib/types/asset";
import type { UniverseAsset } from "@/lib/types/asset";
import type { UniverseIconType } from "@/lib/types/personal";
import {
  X, Loader2, Check, Music, Layers, LayoutGrid, Move,
  Upload, Play, Pause, Trash2, Volume2, Smile, Palette, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "assets" | "bgm" | "menus" | "layout" | "color";

interface MenuNode { id: string; label: string; icon: UniverseIconType; customIcon?: string; }

export interface BgmTrack { url: string; name: string; autoPlay?: boolean; volume?: number; isDefault?: boolean; }

interface SettingsState {
  selectedAssets: string[];
  bgmList: BgmTrack[];
  bgmShuffle: boolean;
  menus: MenuNode[];
  menuLayout: Record<string, { top: string; left: string }>;
  menuLayoutMobile: Record<string, { top: string; left: string }>;
  assetPositions: Record<string, { top: string; left: string }>;
  assetPositionsMobile: Record<string, { top: string; left: string }>;
  color: string;
  customAssets: UniverseAsset[];
}

const COLOR_PRESETS = [
  "#a78bfa", "#60a5fa", "#f472b6", "#34d399",
  "#fbbf24", "#f87171", "#22d3ee", "#c084fc",
  "#fb923c", "#4ade80", "#e879f9", "#38bdf8",
];

const DEFAULT_POS = [
  { top: "18%", left: "50%" },
  { top: "50%", left: "16%" },
  { top: "50%", left: "84%" },
  { top: "82%", left: "50%" },
  { top: "26%", left: "22%" },
  { top: "26%", left: "78%" },
];

const ICON_MAP: Record<string, string> = {
  profile: "👤", diary: "📖", gallery: "🖼", link: "🔗", music: "🎵", note: "📝",
};

/* ─── 메뉴 아이콘 에디터 ─────────────────────── */

const EMOJI_PRESETS = [
  "😊","😎","🤖","👾","🦊","🐱","🐶","🐼",
  "🦋","🌸","🌟","⭐","💫","✨","🔥","🌈",
  "🌙","☀️","🎵","🎨","📚","🎮","🏆","💎",
  "🔮","🎯","🧩","🚀","🌌","💝","🌺","🍀",
  "🦄","🔑","💡","🎁","🎈","📝","📸","🎬",
  "🎤","🎹","🎸","☕","🌊","🏔️","🎭","🎪",
];

function MenuIconEditor({ menus, personalId, onChange }: {
  menus: MenuNode[];
  personalId: string;
  onChange: (updated: MenuNode[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const editingMenu = menus.find((m) => m.id === editingId);

  const apply = (emoji: string) => {
    onChange(menus.map((m) => m.id === editingId ? { ...m, customIcon: emoji } : m));
    setEditingId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;
    setUploading(true);
    try {
      const url = await uploadPersonalImage(personalId, "gallery", file);
      apply(url);
    } catch { alert("이미지 업로드에 실패했습니다."); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const reset = () => {
    onChange(menus.map((m) => m.id === editingId ? { ...m, customIcon: undefined } : m));
    setEditingId(null);
  };

  const ALL_MENU_TYPES: { icon: UniverseIconType; label: string; defaultEmoji: string }[] = [
    { icon: "profile", label: "소개",     defaultEmoji: "👤" },
    { icon: "diary",   label: "다이어리", defaultEmoji: "📖" },
    { icon: "gallery", label: "갤러리",   defaultEmoji: "🖼" },
    { icon: "link",    label: "즐겨찾기", defaultEmoji: "🔗" },
    { icon: "music",   label: "음악",     defaultEmoji: "🎵" },
    { icon: "note",    label: "메모",     defaultEmoji: "📝" },
  ];

  const existingIcons = new Set(menus.map((m) => m.icon));
  const addableTypes = ALL_MENU_TYPES.filter((t) => !existingIcons.has(t.icon));

  const addMenu = (type: { icon: UniverseIconType; label: string; defaultEmoji: string }) => {
    const newMenu: MenuNode = {
      id: type.icon,
      label: type.label,
      icon: type.icon,
    };
    onChange([...menus, newMenu]);
  };

  const removeMenu = (id: string) => {
    onChange(menus.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/50">메뉴를 추가하거나 아이콘을 바꿀 수 있어요.</p>
      <div className="grid grid-cols-3 gap-2">
        {menus.map((menu) => {
          const icon = menu.customIcon;
          const isUrl = icon?.startsWith("http") || icon?.startsWith("/");
          return (
            <div key={menu.id} className="relative group/card">
              <button onClick={() => { setEditingId(menu.id); setCustomText(""); }}
                className={cn(
                  "w-full flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all",
                  editingId === menu.id
                    ? "border-violet-400 bg-violet-500/20"
                    : "border-white/10 bg-white/5 hover:border-violet-400/40"
                )}>
                {isUrl
                  ? <img src={icon} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <span className="text-2xl leading-none">{icon ?? ICON_MAP[menu.id] ?? "⭐"}</span>
                }
                <span className="text-[10px] text-white/50 truncate w-full text-center px-1">{menu.label}</span>
                {icon && <span className="text-[8px] text-violet-400/70">커스텀</span>}
              </button>
              {/* 삭제 버튼 */}
              <button
                onClick={() => removeMenu(menu.id)}
                className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                title="메뉴 삭제">
                <X size={9} className="text-white" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 추가 가능한 메뉴 타입 */}
      {addableTypes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">추가 가능한 메뉴</p>
          <div className="flex flex-wrap gap-1.5">
            {addableTypes.map((t) => (
              <button key={t.icon} onClick={() => addMenu(t)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-white/15 text-white/40 text-xs hover:border-violet-400/50 hover:text-violet-400 transition-colors">
                <span>{t.defaultEmoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingId && editingMenu && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60 flex items-center gap-1.5">
              <Smile size={12} /><span>"{editingMenu.label}" 아이콘</span>
            </span>
            <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          {/* 프리셋 이모지 */}
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_PRESETS.map((emoji) => (
              <button key={emoji} onClick={() => apply(emoji)}
                className="text-lg p-1.5 hover:bg-white/10 rounded-lg transition-colors leading-none">
                {emoji}
              </button>
            ))}
          </div>
          {/* 이미지 업로드 */}
          <button onClick={() => imgInputRef.current?.click()} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/20 text-white/40 text-xs hover:border-violet-400 hover:text-violet-400 transition-colors">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? "업로드 중..." : "이미지 업로드"}
          </button>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          {/* 이모지 직접 입력 */}
          <div className="flex gap-2">
            <input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && customText.trim() && apply(customText.trim())}
              placeholder="이모지 직접 입력..."
              maxLength={4}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/8 border border-white/15 text-sm text-white placeholder-white/25 focus:border-violet-400 focus:outline-none"
            />
            <button onClick={() => customText.trim() && apply(customText.trim())}
              disabled={!customText.trim()}
              className="px-3 py-1.5 rounded-xl bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 disabled:opacity-40">
              적용
            </button>
          </div>
          {/* 기본 복원 */}
          {editingMenu.customIcon && (
            <button onClick={reset} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
              기본 아이콘으로 복원
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── 레이아웃 드래그 탭 (모바일/데스크탑 분리) ── */

type ViewMode = "desktop" | "mobile";

function LayoutTab({
  menus,
  onMenusChange,
  personalId,
  layout,
  layoutMobile,
  onLayoutChange,
  onLayoutMobileChange,
  selectedAssets,
  assetPositions,
  assetPositionsMobile,
  onAssetPosChange,
  onAssetPosMobileChange,
  allAssets,
  profilePhotoUrl,
}: {
  menus: MenuNode[];
  onMenusChange: (menus: MenuNode[]) => void;
  personalId: string;
  layout: Record<string, { top: string; left: string }>;
  layoutMobile: Record<string, { top: string; left: string }>;
  onLayoutChange: (v: Record<string, { top: string; left: string }>) => void;
  onLayoutMobileChange: (v: Record<string, { top: string; left: string }>) => void;
  selectedAssets: string[];
  assetPositions: Record<string, { top: string; left: string }>;
  assetPositionsMobile: Record<string, { top: string; left: string }>;
  onAssetPosChange: (v: Record<string, { top: string; left: string }>) => void;
  onAssetPosMobileChange: (v: Record<string, { top: string; left: string }>) => void;
  allAssets: UniverseAsset[];
  profilePhotoUrl?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);

  // 현재 모드의 레이아웃 값
  const activeLayout    = viewMode === "mobile" ? layoutMobile    : layout;
  const activeAssetPos  = viewMode === "mobile" ? assetPositionsMobile : assetPositions;
  const setActiveLayout    = viewMode === "mobile" ? onLayoutMobileChange    : onLayoutChange;
  const setActiveAssetPos  = viewMode === "mobile" ? onAssetPosMobileChange  : onAssetPosChange;

  const getMenuPos = (id: string, i: number) =>
    activeLayout[id] ?? DEFAULT_POS[i] ?? { top: "50%", left: "50%" };

  const getAssetDefaultPos = (idx: number, total: number) => ({
    top: `${20 + (idx / Math.max(total - 1, 1)) * 60}%`,
    left: `${15 + (idx % 2 === 0 ? 20 : 60)}%`,
  });

  const handlePointerDown = (e: React.PointerEvent, key: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingId.current = key;
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const key = draggingId.current;
    if (!key || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawTop  = ((e.clientY - rect.top)  / rect.height) * 100;
    const rawLeft = ((e.clientX - rect.left) / rect.width)  * 100;
    // 상단 네비게이션(~14%) · 하단 버튼(~84%) 영역 침범 방지
    const top  = Math.min(82, Math.max(16, rawTop )).toFixed(1) + "%";
    const left = Math.min(92, Math.max(8,  rawLeft)).toFixed(1) + "%";
    if (key.startsWith("menu:")) {
      setActiveLayout({ ...activeLayout, [key.slice(5)]: { top, left } });
    } else if (key.startsWith("asset:")) {
      setActiveAssetPos({ ...activeAssetPos, [key.slice(6)]: { top, left } });
    }
  }, [activeLayout, activeAssetPos, setActiveLayout, setActiveAssetPos]);

  const handlePointerUp = () => { draggingId.current = null; };

  return (
    <div className="space-y-4">
      {/* 메뉴 아이콘 커스터마이징 */}
      <div className="space-y-2">
        <p className="text-xs text-white/35 uppercase tracking-wider font-semibold">메뉴 아이콘</p>
        <MenuIconEditor menus={menus} personalId={personalId} onChange={onMenusChange} />
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
      <p className="text-xs text-white/35 uppercase tracking-wider font-semibold">위치 설정</p>
      {/* 모바일 / 데스크탑 토글 */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        {(["desktop", "mobile"] as ViewMode[]).map((m) => (
          <button key={m} onClick={() => setViewMode(m)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              viewMode === m ? "bg-violet-500 text-white" : "text-white/40 hover:text-white/70")}>
            {m === "desktop" ? "💻 데스크탑" : "📱 모바일"}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/40">
        {viewMode === "mobile" ? "모바일" : "데스크탑"} 전용 위치를 드래그해서 설정하세요.
        두 기기의 위치가 독립적으로 저장됩니다.
      </p>

      {/* 범례 */}
      <div className="flex items-center gap-4 text-[10px] text-white/40">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-500/50 border border-violet-400/60 inline-block" />메뉴 노드</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-400/50 inline-block" />에셋</span>
      </div>

      {/* 드래그 영역 — 모바일은 세로 비율, 데스크탑은 가로 비율 */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#05060f] select-none"
        style={{ aspectRatio: viewMode === "mobile" ? "9/16" : "16/9", maxHeight: 380 }}
      >
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white"
              style={{ top: `${(i * 37) % 100}%`, left: `${(i * 61) % 100}%` }} />
          ))}
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-xs text-center pointer-events-none">
          ✦ 별자리
        </div>
        {/* 상단 네비게이션 영역 표시 */}
        <div className="absolute top-0 left-0 right-0 h-[16%] border-b border-dashed border-white/15 pointer-events-none flex items-center justify-center">
          <span className="text-[8px] text-white/20">상단 메뉴 영역</span>
        </div>
        {/* 하단 버튼 영역 표시 */}
        <div className="absolute bottom-0 left-0 right-0 h-[18%] border-t border-dashed border-white/15 pointer-events-none flex items-center justify-center">
          <span className="text-[8px] text-white/20">하단 메뉴 영역</span>
        </div>

        {/* 메뉴 노드 */}
        {menus.slice(0, 6).map((menu, i) => {
          const pos = getMenuPos(menu.id, i);
          return (
            <div key={`m-${menu.id}`}
              onPointerDown={(e) => handlePointerDown(e, `menu:${menu.id}`)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none z-10"
              style={{ top: pos.top, left: pos.left }}>
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-violet-500/30 border border-violet-400/60 flex items-center justify-center text-sm">
                  {menu.customIcon ?? ICON_MAP[menu.id] ?? "⭐"}
                </div>
                <span className="text-[9px] text-white/70 whitespace-nowrap">{menu.label}</span>
              </div>
            </div>
          );
        })}

        {/* 에셋 */}
        {selectedAssets.map((assetId, i) => {
          const pos = activeAssetPos[assetId] ?? getAssetDefaultPos(i, selectedAssets.length);

          // 프로필 사진 에셋
          if (assetId === "profile-photo" && profilePhotoUrl) {
            return (
              <div key="a-profile-photo"
                onPointerDown={(e) => handlePointerDown(e, `asset:profile-photo`)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none z-10"
                style={{ top: pos.top, left: pos.left }}>
                <div className="flex flex-col items-center gap-0.5">
                  <img src={profilePhotoUrl} alt="프로필"
                    className="w-9 h-9 rounded-full object-cover border-2 border-violet-400/50" />
                  <span className="text-[9px] text-white/50 whitespace-nowrap">프로필</span>
                </div>
              </div>
            );
          }

          const asset = allAssets.find((a) => a.id === assetId);
          if (!asset) return null;
          return (
            <div key={`a-${assetId}`}
              onPointerDown={(e) => handlePointerDown(e, `asset:${assetId}`)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none z-10"
              style={{ top: pos.top, left: pos.left }}>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-lg">
                  {asset.emoji}
                </div>
                <span className="text-[9px] text-white/50 whitespace-nowrap">{asset.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setActiveLayout({})}
          className="text-xs text-white/30 hover:text-white/60 transition-colors">
          메뉴 위치 초기화
        </button>
        <span className="text-white/20">·</span>
        <button onClick={() => setActiveAssetPos({})}
          className="text-xs text-white/30 hover:text-white/60 transition-colors">
          에셋 위치 초기화
        </button>
      </div>
      </div>{/* /위치 설정 */}
    </div>
  );
}

/* ─── BGM 탭 (누적 목록, 최대 3개) ─────────────── */

function BgmTab({
  personalId,
  bgmList,
  bgmShuffle,
  onChange,
  onShuffleChange,
  bgmPlaying,
  onToggleBgm,
}: {
  personalId: string;
  bgmList: BgmTrack[];
  bgmShuffle: boolean;
  onChange: (list: BgmTrack[]) => void;
  onShuffleChange: (v: boolean) => void;
  bgmPlaying: boolean;
  onToggleBgm: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 3;

  const previewTrack = (idx: number) => {
    // 이미 재생 중인 트랙 클릭 → 정지
    if (previewIdx === idx) {
      previewRef.current?.pause();
      previewRef.current = null;
      setPreviewIdx(null);
      return;
    }
    // 다른 트랙 클릭 → 기존 정지 후 새 트랙 재생
    previewRef.current?.pause();
    previewRef.current = null;
    const track = bgmList[idx];
    if (!track) return;
    const audio = new Audio(track.url);
    audio.volume = track.volume ?? 1;
    audio.play().catch(() => {});
    audio.onended = () => { setPreviewIdx(null); previewRef.current = null; };
    previewRef.current = audio;
    setPreviewIdx(idx);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPersonalAudio(personalId, file);
      const name = file.name.replace(/\.[^.]+$/, "");
      onChange([...bgmList, { url, name, isDefault: false }]);
    } catch {
      alert("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = (idx: number) => {
    if (previewIdx === idx) { previewRef.current?.pause(); previewRef.current = null; setPreviewIdx(null); }
    onChange(bgmList.filter((_, i) => i !== idx));
  };

  // 기본값(방문 시 자동재생) 토글 — 하나만 켤 수 있음
  const toggleDefault = (idx: number) =>
    onChange(bgmList.map((t, i) => ({ ...t, isDefault: i === idx ? !t.isDefault : false })));

  const setVolume = (idx: number, vol: number) =>
    onChange(bgmList.map((t, i) => i === idx ? { ...t, volume: vol } : t));

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">
        배경음악을 최대 {MAX}개까지 추가할 수 있어요.<br />
        MP3 · WAV · OGG 형식 지원
      </p>

      {/* 랜덤재생 토글 */}
      {bgmList.length > 1 && (
        <label className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
          <div>
            <p className="text-sm font-medium text-white">🎲 랜덤재생</p>
            <p className="text-[11px] text-white/40">방문 시 목록 중 랜덤으로 재생</p>
          </div>
          <div onClick={() => onShuffleChange(!bgmShuffle)}
            className={cn("w-9 h-5 rounded-full transition-colors relative shrink-0",
              bgmShuffle ? "bg-violet-500" : "bg-white/20")}>
            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              bgmShuffle ? "translate-x-4" : "translate-x-0.5")} />
          </div>
        </label>
      )}

      {/* 트랙 목록 */}
      {bgmList.length > 0 && (
        <div className="space-y-2">
          {bgmList.map((track, i) => (
            <div key={track.url + i} className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2">
              <div className="flex items-center gap-3">
                {/* 개별 프리뷰 재생 버튼 */}
                <button onClick={() => previewTrack(i)}
                  className={cn(
                    "w-9 h-9 rounded-full border flex items-center justify-center transition-colors shrink-0",
                    previewIdx === i
                      ? "bg-violet-500 border-violet-400 text-white"
                      : "bg-violet-500/20 border-violet-400/40 text-white hover:bg-violet-500/40"
                  )}>
                  {previewIdx === i ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{track.name}</p>
                  <p className="text-[10px] text-white/30">트랙 {i + 1}</p>
                </div>
                <button onClick={() => remove(i)}
                  className="p-1.5 text-white/30 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              {/* 볼륨 슬라이더 */}
              <div className="flex items-center gap-2">
                <Volume2 size={12} className="text-white/30 shrink-0" />
                <input
                  type="range" min="0" max="100"
                  value={Math.round((track.volume ?? 1) * 100)}
                  onChange={(e) => setVolume(i, parseInt(e.target.value) / 100)}
                  className="flex-1 h-1 accent-violet-400 cursor-pointer"
                />
                <span className="text-[10px] text-white/35 w-8 text-right tabular-nums">
                  {Math.round((track.volume ?? 1) * 100)}%
                </span>
              </div>
              {/* 기본값 토글 (랜덤재생 꺼져있을 때만 의미 있음) */}
              {!bgmShuffle && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => toggleDefault(i)}
                    className={cn("w-9 h-5 rounded-full transition-colors relative cursor-pointer",
                      track.isDefault ? "bg-violet-500" : "bg-white/20")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      track.isDefault ? "translate-x-4" : "translate-x-0.5")} />
                  </div>
                  <span className="text-xs text-white/60">기본값 (방문 시 자동재생)</span>
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 추가 버튼 */}
      {bgmList.length < MAX ? (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full py-6 rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center gap-2 text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors">
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
          <span className="text-sm font-medium">{uploading ? "업로드 중..." : `음악 추가 (${bgmList.length}/${MAX})`}</span>
          <span className="text-xs text-white/20">MP3, WAV, OGG</span>
        </button>
      ) : (
        <p className="text-xs text-white/30 text-center py-2">최대 {MAX}개까지 추가할 수 있어요.</p>
      )}

      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}

/* ─── 에셋 탭 ────────────────────────────────── */

function AssetsTab({
  selected,
  allAssets,
  customAssets,
  profilePhotoUrl,
  personalId,
  onChange,
  onCustomAssetsChange,
}: {
  selected: string[];
  allAssets: UniverseAsset[];
  customAssets: UniverseAsset[];
  profilePhotoUrl?: string;
  personalId: string;
  onChange: (ids: string[]) => void;
  onCustomAssetsChange: (assets: UniverseAsset[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const photoActive = selected.includes("profile-photo");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPersonalAsset(personalId, file);
      const newAsset: UniverseAsset = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, "").slice(0, 12) || "커스텀",
        emoji: "🖼️",
        imageUrl: url,
        category: "object",
        animationType: "float",
        isFree: true,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };
      const updated = [...customAssets, newAsset];
      onCustomAssetsChange(updated);
      // 업로드하자마자 선택 상태에 추가
      onChange([...selected, newAsset.id]);
    } catch (err: unknown) {
      alert((err as { message?: string })?.message ?? "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeCustom = (assetId: string) => {
    onCustomAssetsChange(customAssets.filter((a) => a.id !== assetId));
    onChange(selected.filter((id) => id !== assetId));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">우주에 띄울 에셋을 선택하세요. 여러 개 조합 가능해요.</p>

      {/* 나만의 에셋 섹션 (프로필 사진 + 커스텀 업로드) */}
      <div>
        <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 font-semibold">나만의 에셋</p>
        <div className="space-y-2">
          {/* 프로필 사진 */}
          {profilePhotoUrl && (
            <button onClick={() => toggle("profile-photo")}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 transition-all text-left",
                photoActive
                  ? "border-violet-400 bg-violet-500/20"
                  : "border-white/10 bg-white/5 hover:border-violet-400/40"
              )}>
              <img src={profilePhotoUrl} alt="프로필" className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">프로필 사진</p>
                <p className="text-[10px] text-white/40">우주 어딘가에 내 사진을 띄워요</p>
              </div>
              {photoActive && <Check size={14} className="text-violet-400 shrink-0" />}
            </button>
          )}

          {/* 커스텀 업로드 에셋 목록 */}
          {customAssets.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {customAssets.map((asset) => {
                const active = selected.includes(asset.id);
                return (
                  <div key={asset.id} className="relative group">
                    <button onClick={() => toggle(asset.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 w-full rounded-2xl border-2 transition-all",
                        active
                          ? "border-violet-400 bg-violet-500/20 scale-105"
                          : "border-white/10 bg-white/5 hover:border-violet-400/40"
                      )}>
                      {asset.imageUrl
                        ? <img src={asset.imageUrl} alt={asset.name} className="w-8 h-8 object-contain" />
                        : <span className="text-2xl">{asset.emoji}</span>
                      }
                      <span className="text-[10px] text-white/60 truncate w-full text-center px-1">{asset.name}</span>
                      {active && <Check size={10} className="text-violet-400" />}
                    </button>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCustom(asset.id); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 업로드 버튼 */}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-white/15 text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors text-xs font-medium">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "업로드 중..." : "이미지 업로드 (PNG · WebP · GIF · SVG)"}
          </button>
          <input ref={fileRef} type="file" accept=".png,.webp,.gif,.svg,image/png,image/webp,image/gif,image/svg+xml" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* 기본 에셋 */}
      <div>
        <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 font-semibold">기본 에셋</p>
        <div className="grid grid-cols-4 gap-2">
          {allAssets.filter((a) => a.isFree && a.id !== "profile-photo").map((asset) => {
            const active = selected.includes(asset.id);
            return (
              <button key={asset.id} onClick={() => toggle(asset.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all",
                  active
                    ? "border-violet-400 bg-violet-500/20 scale-105"
                    : "border-white/10 bg-white/5 hover:border-violet-400/40"
                )}>
                <span className="text-2xl">{asset.emoji}</span>
                <span className="text-[10px] text-white/60">{asset.name}</span>
                {active && <Check size={10} className="text-violet-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── 주요 국가 목록 ─── */
const COUNTRIES = [
  { code: "KR", name: "대한민국" }, { code: "US", name: "미국" },
  { code: "JP", name: "일본" }, { code: "CN", name: "중국" },
  { code: "GB", name: "영국" }, { code: "DE", name: "독일" },
  { code: "FR", name: "프랑스" }, { code: "CA", name: "캐나다" },
  { code: "AU", name: "호주" }, { code: "BR", name: "브라질" },
  { code: "IN", name: "인도" }, { code: "SG", name: "싱가포르" },
  { code: "TH", name: "태국" }, { code: "VN", name: "베트남" },
  { code: "TW", name: "대만" }, { code: "HK", name: "홍콩" },
  { code: "MX", name: "멕시코" }, { code: "ES", name: "스페인" },
  { code: "IT", name: "이탈리아" }, { code: "NL", name: "네덜란드" },
  { code: "SE", name: "스웨덴" }, { code: "NO", name: "노르웨이" },
  { code: "NZ", name: "뉴질랜드" }, { code: "PT", name: "포르투갈" },
];

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

function NationTab({ personalId, currentCountry, countryChangedAt, isAdmin, onChanged }: {
  personalId: string;
  currentCountry?: string;
  countryChangedAt?: string;
  isAdmin: boolean;
  onChanged: (code: string, changedAt: string) => void;
}) {
  const [selected, setSelected] = useState(currentCountry ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // 한 달 내 변경 여부 확인
  const canChange = isAdmin || (() => {
    if (!countryChangedAt) return true;
    const last = new Date(countryChangedAt).getTime();
    return Date.now() - last > 30 * 24 * 60 * 60 * 1000;
  })();

  const daysUntilNext = (() => {
    if (!countryChangedAt || canChange) return 0;
    const last = new Date(countryChangedAt).getTime();
    const remain = 30 * 24 * 60 * 60 * 1000 - (Date.now() - last);
    return Math.ceil(remain / (24 * 60 * 60 * 1000));
  })();

  const handleSave = async () => {
    if (!selected || selected === currentCountry || !canChange) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await saveCountry(personalId, selected, now);
      onChanged(selected, now);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-white/40 text-xs leading-relaxed">
        국적은 우주 탐험 화면에서 별자리가 배치되는 구역을 결정합니다.
        {isAdmin
          ? " (어드민: 제한 없음)"
          : " 무료 변경은 월 1회입니다."}
      </p>

      {!canChange && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 px-4 py-3 text-xs text-amber-300">
          다음 변경까지 {daysUntilNext}일 남았습니다.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {COUNTRIES.map((c) => (
          <button key={c.code}
            disabled={!canChange}
            onClick={() => setSelected(c.code)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs transition-all",
              selected === c.code
                ? "border-violet-400 bg-violet-500/20 text-white font-semibold"
                : "border-white/10 bg-white/5 text-white/50 hover:border-white/25 hover:text-white/80",
              !canChange && "opacity-40 cursor-not-allowed",
            )}>
            <span className="text-base leading-none">{countryFlag(c.code)}</span>
            <span className="truncate">{c.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!selected || selected === currentCountry || !canChange || saving}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-30"
        style={{ backgroundColor: "#7c3aed" }}>
        {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : done ? "✓ 저장됨" : "저장"}
      </button>
    </div>
  );
}

/* ─── 메인 설정 패널 ─────────────────────────── */

export function UniverseSettings({
  personalId,
  menus: initialMenus,
  initialAssets,
  initialBgmList,
  initialBgmShuffle = false,
  initialLayout,
  initialLayoutMobile,
  initialAssetPositions,
  initialAssetPositionsMobile,
  initialCustomAssets = [],
  allAssets = DEFAULT_ASSETS,
  profilePhotoUrl,
  bgmPlaying,
  initialColor = "#a78bfa",
  onToggleBgm,
  onClose,
  onSaved,
}: {
  personalId: string;
  menus: MenuNode[];
  initialAssets: string[];
  initialBgmList: BgmTrack[];
  initialBgmShuffle?: boolean;
  initialLayout?: Record<string, { top: string; left: string }>;
  initialLayoutMobile?: Record<string, { top: string; left: string }>;
  initialAssetPositions?: Record<string, { top: string; left: string }>;
  initialAssetPositionsMobile?: Record<string, { top: string; left: string }>;
  initialCustomAssets?: UniverseAsset[];
  allAssets?: UniverseAsset[];
  profilePhotoUrl?: string;
  bgmPlaying: boolean;
  onToggleBgm: () => void;
  onClose: () => void;
  onSaved: (state: SettingsState) => void;
  initialColor?: string;
}) {
  const [tab, setTab] = useState<Tab>("assets");
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<SettingsState>({
    selectedAssets: initialAssets,
    bgmList: initialBgmList,
    bgmShuffle: initialBgmShuffle,
    menus: initialMenus,
    menuLayout:           initialLayout               ?? {},
    menuLayoutMobile:     initialLayoutMobile         ?? {},
    assetPositions:       initialAssetPositions       ?? {},
    assetPositionsMobile: initialAssetPositionsMobile ?? {},
    color: initialColor,
    customAssets: initialCustomAssets,
  });

  const save = async () => {
    setSaving(true);
    try {
      /**
       * Firestore updateDoc에서 { universe: {...} } 형태로 보내면
       * universe 필드 전체가 교체되어 color/menus/favoriteNumber 등이 삭제됨.
       * dot-notation("universe.xxx")으로 설정 관련 필드만 개별 업데이트.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update: Record<string, any> = {
        "universe.selectedAssets": state.selectedAssets,
        "universe.bgmList": state.bgmList,
        "universe.bgmShuffle": state.bgmShuffle,
        "universe.menus": state.menus,
        "universe.color": state.color,
      };

      if (Object.keys(state.menuLayout).length > 0)
        update["universe.menuLayout"] = state.menuLayout;
      if (Object.keys(state.menuLayoutMobile).length > 0)
        update["universe.menuLayoutMobile"] = state.menuLayoutMobile;
      if (Object.keys(state.assetPositions).length > 0)
        update["universe.assetPositions"] = state.assetPositions;
      if (Object.keys(state.assetPositionsMobile).length > 0)
        update["universe.assetPositionsMobile"] = state.assetPositionsMobile;

      // 커스텀 에셋은 배열이라 별도 저장 (dot-notation 배열은 Firestore에서 덮어쓰기 됨)
      await saveCustomAssets(personalId, state.customAssets);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePersonal(personalId, update as any);
      onSaved(state);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "assets",  label: "에셋",   icon: <Layers size={14} /> },
    { id: "bgm",     label: "BGM",    icon: <Music size={14} /> },
    { id: "menus",   label: "메뉴",   icon: <LayoutGrid size={14} /> },
    { id: "layout",  label: "레이아웃", icon: <Move size={14} /> },
    { id: "color",   label: "별자리색", icon: <Palette size={14} /> },
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full sm:max-w-md bg-[#0a0f24] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="font-bold text-white text-base">⚙ 우주 설정</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mx-5 mb-4 p-1 bg-white/5 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                tab === t.id ? "bg-violet-500 text-white" : "text-white/40 hover:text-white/70")}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {tab === "assets" && (
            <AssetsTab
              selected={state.selectedAssets}
              allAssets={allAssets}
              customAssets={state.customAssets}
              profilePhotoUrl={profilePhotoUrl}
              personalId={personalId}
              onChange={(ids) => setState((p) => ({ ...p, selectedAssets: ids }))}
              onCustomAssetsChange={(customAssets) => setState((p) => ({ ...p, customAssets }))}
            />
          )}
          {tab === "bgm" && (
            <BgmTab
              personalId={personalId}
              bgmList={state.bgmList}
              bgmShuffle={state.bgmShuffle}
              onChange={(bgmList) => setState((p) => ({ ...p, bgmList }))}
              onShuffleChange={(v) => setState((p) => ({ ...p, bgmShuffle: v }))}
              bgmPlaying={bgmPlaying}
              onToggleBgm={onToggleBgm}
            />
          )}
          {tab === "menus" && (
            <MenuIconEditor
              menus={state.menus}
              personalId={personalId}
              onChange={(menus) => setState((p) => ({ ...p, menus }))}
            />
          )}
          {tab === "layout" && (
            <LayoutTab
              menus={state.menus}
              onMenusChange={(menus) => setState((p) => ({ ...p, menus }))}
              personalId={personalId}
              layout={state.menuLayout}
              layoutMobile={state.menuLayoutMobile}
              onLayoutChange={(v) => setState((p) => ({ ...p, menuLayout: v }))}
              onLayoutMobileChange={(v) => setState((p) => ({ ...p, menuLayoutMobile: v }))}
              selectedAssets={state.selectedAssets}
              assetPositions={state.assetPositions}
              assetPositionsMobile={state.assetPositionsMobile}
              onAssetPosChange={(v) => setState((p) => ({ ...p, assetPositions: v }))}
              onAssetPosMobileChange={(v) => setState((p) => ({ ...p, assetPositionsMobile: v }))}
              allAssets={allAssets}
              profilePhotoUrl={profilePhotoUrl}
            />
          )}
          {tab === "color" && (
            <div className="space-y-5 py-2">
              <p className="text-white/40 text-xs leading-relaxed">
                별자리 모양은 유지하면서 색깔만 바꿀 수 있어요.
              </p>
              {/* 미리보기 */}
              <div className="flex items-center justify-center py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${state.color}22`, boxShadow: `0 0 32px ${state.color}66` }}>
                  <span className="text-2xl">✦</span>
                </div>
              </div>
              {/* 프리셋 */}
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button key={c} onClick={() => setState((p) => ({ ...p, color: c }))}
                    className={cn("w-full aspect-square rounded-full transition-transform",
                      state.color === c ? "ring-2 ring-white scale-110" : "hover:scale-105")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              {/* 커스텀 컬러 */}
              <div className="flex items-center gap-3">
                <input type="color" value={state.color}
                  onChange={(e) => setState((p) => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent" />
                <span className="text-white/50 text-xs font-mono">{state.color}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <button onClick={save} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-500 text-white font-bold hover:bg-violet-600 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
