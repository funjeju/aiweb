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

interface SettingsState {
  selectedAssets: string[];
  bgm: { url: string; name: string; autoPlay: boolean } | null;
  menuLayout: Record<string, { top: string; left: string }>;
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
  onChange,
}: {
  menus: MenuNode[];
  layout: Record<string, { top: string; left: string }>;
  onChange: (layout: Record<string, { top: string; left: string }>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);

  const getPos = (id: string, i: number) =>
    layout[id] ?? DEFAULT_POS[i] ?? { top: "50%", left: "50%" };

  const parsePercent = (val: string) => parseFloat(val) / 100;

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingId.current = id;
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const top = Math.min(95, Math.max(5, ((e.clientY - rect.top) / rect.height) * 100)).toFixed(1) + "%";
    const left = Math.min(95, Math.max(5, ((e.clientX - rect.left) / rect.width) * 100)).toFixed(1) + "%";
    onChange({ ...layout, [draggingId.current]: { top, left } });
  }, [layout, onChange]);

  const handlePointerUp = () => { draggingId.current = null; };

  const resetLayout = () => onChange({});

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/50">메뉴 노드를 드래그해서 원하는 위치에 배치하세요.</p>

      {/* 드래그 영역 */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#05060f] select-none"
        style={{ aspectRatio: "9/16", maxHeight: 360 }}
      >
        {/* 배경 별 느낌 */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white"
              style={{ top: `${(i * 37) % 100}%`, left: `${(i * 61) % 100}%` }} />
          ))}
        </div>

        {/* 중앙 별자리 이름 자리 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-xs text-center pointer-events-none">
          ✦ 별자리
        </div>

        {/* 드래그 가능한 메뉴 노드 */}
        {menus.slice(0, 6).map((menu, i) => {
          const pos = getPos(menu.id, i);
          return (
            <div
              key={menu.id}
              onPointerDown={(e) => handlePointerDown(e, menu.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-violet-500/30 border border-violet-400/60 flex items-center justify-center text-sm shadow-lg shadow-violet-500/20">
                  {ICON_MAP[menu.id] ?? "⭐"}
                </div>
                <span className="text-[9px] text-white/70 whitespace-nowrap">{menu.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={resetLayout}
        className="text-xs text-white/30 hover:text-white/60 transition-colors">
        기본 위치로 초기화
      </button>
    </div>
  );
}

/* ─── BGM 탭 ─────────────────────────────────── */

function BgmTab({
  personalId,
  bgm,
  onChange,
}: {
  personalId: string;
  bgm: SettingsState["bgm"];
  onChange: (bgm: SettingsState["bgm"]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPersonalAudio(personalId, file);
      onChange({ url, name: file.name.replace(/\.[^.]+$/, ""), autoPlay: bgm?.autoPlay ?? false });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const togglePlay = () => {
    if (!bgm?.url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(bgm.url);
      audioRef.current.loop = true;
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">
        내 우주에서 흘러나올 배경음악을 설정하세요.<br />
        MP3 · WAV · OGG 형식 지원 (최대 20MB 권장)
      </p>

      {bgm?.url ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
          {/* 현재 트랙 */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-violet-500/30 border border-violet-400/50 flex items-center justify-center text-white hover:bg-violet-500/50 transition-colors">
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{bgm.name}</p>
              <p className="text-xs text-white/40">우주 배경음악</p>
            </div>
            <button onClick={() => { audioRef.current?.pause(); setPlaying(false); onChange(null); }}
              className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>

          {/* 자동재생 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => onChange({ ...bgm, autoPlay: !bgm.autoPlay })}
              className={cn("w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                bgm.autoPlay ? "bg-violet-500" : "bg-white/20")}>
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                bgm.autoPlay ? "translate-x-5" : "translate-x-0.5")} />
            </div>
            <span className="text-sm text-white/70">방문 시 자동재생</span>
          </label>

          {/* 교체 */}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full py-2 rounded-xl border border-dashed border-white/20 text-xs text-white/40 hover:border-violet-400 hover:text-violet-400 transition-colors">
            다른 음악으로 교체
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center gap-2 text-white/30 hover:border-violet-400 hover:text-violet-400 transition-colors">
          {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
          <span className="text-sm font-medium">{uploading ? "업로드 중..." : "음악 파일 업로드"}</span>
          <span className="text-xs text-white/20">MP3, WAV, OGG</span>
        </button>
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
  initialBgm,
  initialLayout,
  allAssets = DEFAULT_ASSETS,
  onClose,
  onSaved,
}: {
  personalId: string;
  menus: MenuNode[];
  initialAssets: string[];
  initialBgm: { url: string; name: string; autoPlay?: boolean } | null | undefined;
  initialLayout: Record<string, { top: string; left: string }> | undefined;
  allAssets?: UniverseAsset[];
  onClose: () => void;
  onSaved: (state: SettingsState) => void;
}) {
  const [tab, setTab] = useState<Tab>("assets");
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<SettingsState>({
    selectedAssets: initialAssets,
    bgm: initialBgm ? { url: initialBgm.url, name: initialBgm.name, autoPlay: initialBgm.autoPlay ?? false } : null,
    menuLayout: initialLayout ?? {},
  });

  const save = async () => {
    setSaving(true);
    try {
      await updatePersonal(personalId, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        universe: {
          selectedAssets: state.selectedAssets,
          bgm: state.bgm ?? undefined,
          menuLayout: Object.keys(state.menuLayout).length > 0 ? state.menuLayout : undefined,
        } as any,
      });
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
              bgm={state.bgm}
              onChange={(bgm) => setState((p) => ({ ...p, bgm }))}
            />
          )}
          {tab === "layout" && (
            <LayoutTab
              menus={menus}
              layout={state.menuLayout}
              onChange={(layout) => setState((p) => ({ ...p, menuLayout: layout }))}
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
