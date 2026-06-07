"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { updatePersonal } from "@/lib/firebase/personals";
import { uploadPersonalAudio, uploadPersonalImage } from "@/lib/firebase/storage";
import { DEFAULT_ASSETS } from "@/lib/types/asset";
import type { UniverseAsset } from "@/lib/types/asset";
import type { UniverseIconType } from "@/lib/types/personal";
import {
  X, Loader2, Check, Music, Layers, LayoutGrid,
  Upload, Play, Pause, Trash2, Volume2, Smile, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "assets" | "bgm" | "layout" | "color";

interface MenuNode { id: string; label: string; icon: UniverseIconType; customIcon?: string; }

export interface BgmTrack { url: string; name: string; autoPlay?: boolean; volume?: number; }

interface SettingsState {
  selectedAssets: string[];
  bgmList: BgmTrack[];
  menus: MenuNode[];
  menuLayout: Record<string, { top: string; left: string }>;
  menuLayoutMobile: Record<string, { top: string; left: string }>;
  assetPositions: Record<string, { top: string; left: string }>;
  assetPositionsMobile: Record<string, { top: string; left: string }>;
  color: string;
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

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/50">메뉴 아이콘을 원하는 이모지로 바꿀 수 있어요.</p>
      <div className="grid grid-cols-3 gap-2">
        {menus.map((menu) => {
          const icon = menu.customIcon;
          const isUrl = icon?.startsWith("http") || icon?.startsWith("/");
          return (
            <button key={menu.id} onClick={() => { setEditingId(menu.id); setCustomText(""); }}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all",
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
          );
        })}
      </div>

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
    const top  = Math.min(94, Math.max(4, ((e.clientY - rect.top)  / rect.height) * 100)).toFixed(1) + "%";
    const left = Math.min(94, Math.max(4, ((e.clientX - rect.left) / rect.width)  * 100)).toFixed(1) + "%";
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
        {/* 하단 버튼 영역 표시 (겹침 방지 가이드) */}
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
  onChange,
  bgmPlaying,
  onToggleBgm,
}: {
  personalId: string;
  bgmList: BgmTrack[];
  onChange: (list: BgmTrack[]) => void;
  bgmPlaying: boolean;
  onToggleBgm: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 3;

  // 재생 버튼: 메인 플레이어 직접 제어 (동기화)
  const togglePreview = () => {
    onToggleBgm();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPersonalAudio(personalId, file);
      const name = file.name.replace(/\.[^.]+$/, "");
      onChange([...bgmList, { url, name, autoPlay: false }]);
    } catch {
      alert("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = (idx: number) => {
    if (bgmPlaying) onToggleBgm(); // 재생 중이면 정지 후 삭제
    onChange(bgmList.filter((_, i) => i !== idx));
  };

  const toggleAutoPlay = (idx: number) =>
    onChange(bgmList.map((t, i) => i === idx ? { ...t, autoPlay: !t.autoPlay } : t));

  const setVolume = (idx: number, vol: number) => {
    onChange(bgmList.map((t, i) => i === idx ? { ...t, volume: vol } : t));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">
        배경음악을 최대 {MAX}개까지 추가할 수 있어요.<br />
        MP3 · WAV · OGG 형식 지원
      </p>

      {/* 트랙 목록 */}
      {bgmList.length > 0 && (
        <div className="space-y-2">
          {bgmList.map((track, i) => (
            <div key={track.url + i} className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2">
              <div className="flex items-center gap-3">
                {/* 메인 플레이어와 동기화된 재생 버튼 */}
                <button onClick={togglePreview}
                  className="w-9 h-9 rounded-full bg-violet-500/30 border border-violet-400/50 flex items-center justify-center text-white hover:bg-violet-500/50 transition-colors shrink-0">
                  {bgmPlaying ? <Pause size={14} /> : <Play size={14} />}
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
              {/* 자동재생 토글 (첫 번째 트랙에만) */}
              {i === 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => toggleAutoPlay(0)}
                    className={cn("w-9 h-5 rounded-full transition-colors relative cursor-pointer",
                      track.autoPlay ? "bg-violet-500" : "bg-white/20")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      track.autoPlay ? "translate-x-4" : "translate-x-0.5")} />
                  </div>
                  <span className="text-xs text-white/60">방문 시 자동재생</span>
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
  profilePhotoUrl,
  onChange,
}: {
  selected: string[];
  allAssets: UniverseAsset[];
  profilePhotoUrl?: string;
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const photoActive = selected.includes("profile-photo");

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">우주에 띄울 에셋을 선택하세요. 여러 개 조합 가능해요.</p>

      {/* 프로필 사진 에셋 */}
      {profilePhotoUrl && (
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 font-semibold">나만의 에셋</p>
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
        </div>
      )}

      {/* 기본 에셋 */}
      <div>
        {profilePhotoUrl && <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 font-semibold">기본 에셋</p>}
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

/* ─── 메인 설정 패널 ─────────────────────────── */

export function UniverseSettings({
  personalId,
  menus: initialMenus,
  initialAssets,
  initialBgmList,
  initialLayout,
  initialLayoutMobile,
  initialAssetPositions,
  initialAssetPositionsMobile,
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
  initialLayout?: Record<string, { top: string; left: string }>;
  initialLayoutMobile?: Record<string, { top: string; left: string }>;
  initialAssetPositions?: Record<string, { top: string; left: string }>;
  initialAssetPositionsMobile?: Record<string, { top: string; left: string }>;
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
    menus: initialMenus,
    menuLayout:           initialLayout               ?? {},
    menuLayoutMobile:     initialLayoutMobile         ?? {},
    assetPositions:       initialAssetPositions       ?? {},
    assetPositionsMobile: initialAssetPositionsMobile ?? {},
    color: initialColor,
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
    { id: "layout",  label: "레이아웃", icon: <LayoutGrid size={14} /> },
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
        <div className="flex gap-1 mx-5 mb-4 p-1 bg-white/5 rounded-xl shrink-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors",
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
              profilePhotoUrl={profilePhotoUrl}
              onChange={(ids) => setState((p) => ({ ...p, selectedAssets: ids }))}
            />
          )}
          {tab === "bgm" && (
            <BgmTab
              personalId={personalId}
              bgmList={state.bgmList}
              onChange={(bgmList) => setState((p) => ({ ...p, bgmList }))}
              bgmPlaying={bgmPlaying}
              onToggleBgm={onToggleBgm}
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

        {/* 저장 버튼 */}
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
