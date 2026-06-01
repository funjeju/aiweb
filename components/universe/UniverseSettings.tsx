"use client";

import { useState, useRef, useCallback } from "react";
import { updatePersonal } from "@/lib/firebase/personals";
import { uploadPersonalAudio } from "@/lib/firebase/storage";
import { DEFAULT_ASSETS } from "@/lib/types/asset";
import type { UniverseAsset } from "@/lib/types/asset";
import {
  X, Loader2, Check, Music, Layers, LayoutGrid,
  Upload, Play, Pause, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "assets" | "bgm" | "layout";

interface MenuNode { id: string; label: string; }

export interface BgmTrack { url: string; name: string; autoPlay?: boolean; }

interface SettingsState {
  selectedAssets: string[];
  bgmList: BgmTrack[];
  menuLayout: Record<string, { top: string; left: string }>;
  assetPositions: Record<string, { top: string; left: string }>;
}

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

/* ─── 레이아웃 드래그 탭 ─────────────────────── */

function LayoutTab({
  menus,
  layout,
  onLayoutChange,
  selectedAssets,
  assetPositions,
  onAssetPosChange,
  allAssets,
}: {
  menus: MenuNode[];
  layout: Record<string, { top: string; left: string }>;
  onLayoutChange: (layout: Record<string, { top: string; left: string }>) => void;
  selectedAssets: string[];
  assetPositions: Record<string, { top: string; left: string }>;
  onAssetPosChange: (pos: Record<string, { top: string; left: string }>) => void;
  allAssets: UniverseAsset[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // draggingId: "{menu|asset}:{id}" 형태
  const draggingId = useRef<string | null>(null);

  const getMenuPos = (id: string, i: number) =>
    layout[id] ?? DEFAULT_POS[i] ?? { top: "50%", left: "50%" };

  // 에셋 기본 위치 (시드 없이 균등 배치)
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
    const top = Math.min(94, Math.max(4, ((e.clientY - rect.top) / rect.height) * 100)).toFixed(1) + "%";
    const left = Math.min(94, Math.max(4, ((e.clientX - rect.left) / rect.width) * 100)).toFixed(1) + "%";

    if (key.startsWith("menu:")) {
      const id = key.slice(5);
      onLayoutChange({ ...layout, [id]: { top, left } });
    } else if (key.startsWith("asset:")) {
      const id = key.slice(6);
      onAssetPosChange({ ...assetPositions, [id]: { top, left } });
    }
  }, [layout, assetPositions, onLayoutChange, onAssetPosChange]);

  const handlePointerUp = () => { draggingId.current = null; };

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/50">
        메뉴 노드와 에셋을 드래그해서 원하는 위치에 배치하세요.
      </p>

      {/* 범례 */}
      <div className="flex items-center gap-4 text-[10px] text-white/40">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-500/50 border border-violet-400/60 inline-block" />메뉴 노드</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-400/50 inline-block" />에셋</span>
      </div>

      {/* 드래그 영역 */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#05060f] select-none"
        style={{ aspectRatio: "9/16", maxHeight: 380 }}
      >
        {/* 배경 별 */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white"
              style={{ top: `${(i * 37) % 100}%`, left: `${(i * 61) % 100}%` }} />
          ))}
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-xs text-center pointer-events-none">
          ✦ 별자리
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
                  {ICON_MAP[menu.id] ?? "⭐"}
                </div>
                <span className="text-[9px] text-white/70 whitespace-nowrap">{menu.label}</span>
              </div>
            </div>
          );
        })}

        {/* 에셋 */}
        {selectedAssets.map((assetId, i) => {
          const asset = allAssets.find((a) => a.id === assetId);
          if (!asset) return null;
          const pos = assetPositions[assetId] ?? getAssetDefaultPos(i, selectedAssets.length);
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

      <div className="flex gap-3">
        <button onClick={() => onLayoutChange({})}
          className="text-xs text-white/30 hover:text-white/60 transition-colors">
          메뉴 위치 초기화
        </button>
        <span className="text-white/20">·</span>
        <button onClick={() => onAssetPosChange({})}
          className="text-xs text-white/30 hover:text-white/60 transition-colors">
          에셋 위치 초기화
        </button>
      </div>
    </div>
  );
}

/* ─── BGM 탭 (누적 목록, 최대 3개) ─────────────── */

function BgmTab({
  personalId,
  bgmList,
  bgmPlaying,
  onToggleBgm,
  onChange,
}: {
  personalId: string;
  bgmList: BgmTrack[];
  bgmPlaying: boolean;
  onToggleBgm: () => void;
  onChange: (list: BgmTrack[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 3;

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

  const remove = (idx: number) => onChange(bgmList.filter((_, i) => i !== idx));

  const toggleAutoPlay = (idx: number) =>
    onChange(bgmList.map((t, i) => i === idx ? { ...t, autoPlay: !t.autoPlay } : t));

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
                {/* 재생/일시정지: 첫 번째 트랙만 실제 오디오 제어 (현재 구조상) */}
                <button onClick={onToggleBgm}
                  className="w-9 h-9 rounded-full bg-violet-500/30 border border-violet-400/50 flex items-center justify-center text-white hover:bg-violet-500/50 transition-colors shrink-0">
                  {i === 0 && bgmPlaying ? <Pause size={14} /> : <Play size={14} />}
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
  onChange,
}: {
  selected: string[];
  allAssets: UniverseAsset[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/50">우주에 띄울 에셋을 선택하세요. 여러 개 조합 가능해요.</p>
      <div className="grid grid-cols-4 gap-2">
        {allAssets.filter((a) => a.isFree).map((asset) => {
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
  );
}

/* ─── 메인 설정 패널 ─────────────────────────── */

export function UniverseSettings({
  personalId,
  menus,
  initialAssets,
  initialBgmList,
  initialLayout,
  initialAssetPositions,
  allAssets = DEFAULT_ASSETS,
  bgmPlaying,
  onToggleBgm,
  onClose,
  onSaved,
}: {
  personalId: string;
  menus: MenuNode[];
  initialAssets: string[];
  initialBgmList: BgmTrack[];
  initialLayout: Record<string, { top: string; left: string }> | undefined;
  initialAssetPositions?: Record<string, { top: string; left: string }>;
  allAssets?: UniverseAsset[];
  bgmPlaying: boolean;
  onToggleBgm: () => void;
  onClose: () => void;
  onSaved: (state: SettingsState) => void;
}) {
  const [tab, setTab] = useState<Tab>("assets");
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<SettingsState>({
    selectedAssets: initialAssets,
    bgmList: initialBgmList,
    menuLayout: initialLayout ?? {},
    assetPositions: initialAssetPositions ?? {},
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
      };

      if (Object.keys(state.menuLayout).length > 0) {
        update["universe.menuLayout"] = state.menuLayout;
      }

      if (Object.keys(state.assetPositions).length > 0) {
        update["universe.assetPositions"] = state.assetPositions;
      }

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
              onChange={(ids) => setState((p) => ({ ...p, selectedAssets: ids }))}
            />
          )}
          {tab === "bgm" && (
            <BgmTab
              personalId={personalId}
              bgmList={state.bgmList}
              bgmPlaying={bgmPlaying}
              onToggleBgm={onToggleBgm}
              onChange={(bgmList) => setState((p) => ({ ...p, bgmList }))}
            />
          )}
          {tab === "layout" && (
            <LayoutTab
              menus={menus}
              layout={state.menuLayout}
              onLayoutChange={(layout) => setState((p) => ({ ...p, menuLayout: layout }))}
              selectedAssets={state.selectedAssets}
              assetPositions={state.assetPositions}
              onAssetPosChange={(pos) => setState((p) => ({ ...p, assetPositions: pos }))}
              allAssets={allAssets}
            />
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
