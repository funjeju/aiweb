"use client";

import { useState } from "react";
import {
  ChevronLeft, Plus, Trash2, ExternalLink, Folder,
  Youtube, Globe, BookOpen, Music, Film, Gamepad2, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveFavorites } from "@/lib/firebase/personals";
import type { FavoriteFolder, FavoriteItem, FavoriteFolderType } from "@/lib/types/personal";

/* ─── 폴더 타입 메타 ─── */
const FOLDER_TYPES: { type: FavoriteFolderType; label: string; icon: React.ReactNode; defaultEmoji: string }[] = [
  { type: "youtube",  label: "YouTube",  icon: <Youtube  size={14} />, defaultEmoji: "▶️" },
  { type: "web",      label: "Web",      icon: <Globe    size={14} />, defaultEmoji: "🌐" },
  { type: "book",     label: "Books",    icon: <BookOpen size={14} />, defaultEmoji: "📚" },
  { type: "music",    label: "Music",    icon: <Music    size={14} />, defaultEmoji: "🎵" },
  { type: "film",     label: "Film",     icon: <Film     size={14} />, defaultEmoji: "🎬" },
  { type: "game",     label: "Game",     icon: <Gamepad2 size={14} />, defaultEmoji: "🎮" },
  { type: "other",    label: "Other",    icon: <Star     size={14} />, defaultEmoji: "✨" },
];

function folderMeta(type: FavoriteFolderType) {
  return FOLDER_TYPES.find((f) => f.type === type) ?? FOLDER_TYPES[FOLDER_TYPES.length - 1];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ─── Props ─── */
interface Props {
  personalId: string;
  isOwner: boolean;
  color: string;
  initialFolders?: FavoriteFolder[];
  onSaved?: (folders: FavoriteFolder[]) => void;
}

/* ─── Main ─── */
export function FavoritesPanel({ personalId, isOwner, color, initialFolders, onSaved }: Props) {
  const [folders, setFolders] = useState<FavoriteFolder[]>(initialFolders ?? []);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* 변경 → Firestore 저장 */
  const persist = async (next: FavoriteFolder[]) => {
    setFolders(next);
    onSaved?.(next); // 부모 data 업데이트 (패널 재마운트 시 초기화 방지)
    if (!isOwner) return;
    setSaving(true);
    try { await saveFavorites(personalId, next); } finally { setSaving(false); }
  };

  const openFolder = folders.find((f) => f.id === openFolderId) ?? null;

  /* ── 폴더 목록 뷰 ── */
  if (!openFolder) {
    return (
      <FolderListView
        folders={folders}
        isOwner={isOwner}
        color={color}
        saving={saving}
        onOpenFolder={(id) => setOpenFolderId(id)}
        onAddFolder={(folder) => persist([...folders, folder])}
        onDeleteFolder={(id) => persist(folders.filter((f) => f.id !== id))}
      />
    );
  }

  /* ── 폴더 내부 뷰 ── */
  return (
    <FolderDetailView
      folder={openFolder}
      isOwner={isOwner}
      color={color}
      saving={saving}
      onBack={() => setOpenFolderId(null)}
      onUpdateFolder={(updated) =>
        persist(folders.map((f) => (f.id === updated.id ? updated : f)))
      }
    />
  );
}

/* ─── 폴더 목록 뷰 ─── */
function FolderListView({
  folders, isOwner, color, saving,
  onOpenFolder, onAddFolder, onDeleteFolder,
}: {
  folders: FavoriteFolder[];
  isOwner: boolean;
  color: string;
  saving: boolean;
  onOpenFolder: (id: string) => void;
  onAddFolder: (f: FavoriteFolder) => void;
  onDeleteFolder: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<FavoriteFolderType>("web");
  const [newEmoji, setNewEmoji] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    const meta = folderMeta(newType);
    onAddFolder({
      id: uid(),
      name: newName.trim(),
      type: newType,
      emoji: newEmoji.trim() || meta.defaultEmoji,
      items: [],
      createdAt: new Date().toISOString(),
    });
    setNewName("");
    setNewEmoji("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      {/* 저장 중 표시 */}
      {saving && (
        <p className="text-[10px] text-white/25 text-right">저장 중…</p>
      )}

      {folders.length === 0 && !adding && (
        <div className="py-8 text-center">
          <Folder size={28} className="mx-auto mb-2 text-white/15" />
          <p className="text-white/30 text-sm">
            {isOwner ? "폴더를 만들어 즐겨찾기를 시작해보세요" : "아직 즐겨찾기가 없어요"}
          </p>
        </div>
      )}

      {/* 폴더 그리드 */}
      {folders.map((folder) => {
        const meta = folderMeta(folder.type);
        return (
          <div key={folder.id}
            className="group flex items-center gap-3 rounded-2xl bg-white/5 border border-white/8 px-4 py-3 hover:border-white/15 transition-colors cursor-pointer"
            onClick={() => onOpenFolder(folder.id)}>
            <span className="text-xl shrink-0">{folder.emoji || meta.defaultEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{folder.name}</p>
              <p className="text-[11px] text-white/35">
                {meta.label} · {folder.items.length}개
              </p>
            </div>
            <ChevronLeft size={14} className="text-white/20 rotate-180 group-hover:text-white/50 transition-colors shrink-0" />
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                className="shrink-0 text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        );
      })}

      {/* 폴더 추가 */}
      {isOwner && (
        adding ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex gap-2">
              {/* 이모지 */}
              <input
                className="w-12 bg-white/5 border border-white/10 rounded-xl px-2 text-center text-lg outline-none focus:border-white/25"
                placeholder="📁"
                value={newEmoji}
                maxLength={2}
                onChange={(e) => setNewEmoji(e.target.value)}
              />
              {/* 이름 */}
              <input
                autoFocus
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/30"
                placeholder="폴더 이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            {/* 타입 선택 */}
            <div className="flex flex-wrap gap-1.5">
              {FOLDER_TYPES.map((ft) => (
                <button key={ft.type}
                  onClick={() => setNewType(ft.type)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors",
                    newType === ft.type
                      ? "text-white"
                      : "bg-white/5 text-white/40 hover:text-white/70"
                  )}
                  style={newType === ft.type ? { backgroundColor: color + "40", color } : {}}>
                  {ft.icon}{ft.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)}
                className="px-3 py-1.5 text-xs text-white/40 hover:text-white transition-colors">
                취소
              </button>
              <button onClick={handleAdd}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: color }}>
                만들기
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-dashed border-white/15 text-white/30 text-xs hover:border-white/30 hover:text-white/60 transition-colors">
            <Plus size={13} />새 폴더
          </button>
        )
      )}
    </div>
  );
}

/* ─── 폴더 내부 뷰 ─── */
function FolderDetailView({
  folder, isOwner, color, saving,
  onBack, onUpdateFolder,
}: {
  folder: FavoriteFolder;
  isOwner: boolean;
  color: string;
  saving: boolean;
  onBack: () => void;
  onUpdateFolder: (f: FavoriteFolder) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const meta = folderMeta(folder.type);
  const urlRequired = ["youtube", "web"].includes(folder.type);

  const updateItems = (items: FavoriteItem[]) =>
    onUpdateFolder({ ...folder, items });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    if (urlRequired && !newUrl.trim()) return;
    const item: FavoriteItem = {
      id: uid(),
      title: newTitle.trim(),
      url: newUrl.trim() || undefined,
      description: newDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    updateItems([...folder.items, item]);
    setNewTitle("");
    setNewUrl("");
    setNewDesc("");
    setAdding(false);
  };

  const handleDelete = (id: string) =>
    updateItems(folder.items.filter((it) => it.id !== id));

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onBack}
          className="flex items-center gap-1 text-white/40 hover:text-white transition-colors text-xs">
          <ChevronLeft size={14} />
        </button>
        <span className="text-lg">{folder.emoji || meta.defaultEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{folder.name}</p>
          <p className="text-[10px] text-white/30">{meta.label} · {folder.items.length}개</p>
        </div>
        {saving && <p className="text-[10px] text-white/25">저장 중…</p>}
      </div>

      {/* 아이템 목록 */}
      {folder.items.length === 0 && !adding && (
        <p className="text-center text-white/25 text-sm py-6">
          {isOwner ? "아직 아무것도 없어요. 추가해보세요." : "아직 비어있어요."}
        </p>
      )}

      {folder.items.map((item) => (
        <ItemCard key={item.id} item={item} color={color} isOwner={isOwner} onDelete={handleDelete} />
      ))}

      {/* 아이템 추가 폼 */}
      {isOwner && (
        adding ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2.5">
            <input
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/30"
              placeholder={folder.type === "book" ? "책 제목" : "제목"}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/30"
              placeholder={urlRequired ? "URL (필수)" : "URL (선택)"}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/30"
              placeholder="메모 (선택)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)}
                className="px-3 py-1.5 text-xs text-white/40 hover:text-white transition-colors">
                취소
              </button>
              <button onClick={handleAdd}
                disabled={!newTitle.trim() || (urlRequired && !newUrl.trim())}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-colors"
                style={{ backgroundColor: color }}>
                추가
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-dashed border-white/15 text-white/30 text-xs hover:border-white/30 hover:text-white/60 transition-colors">
            <Plus size={13} />추가
          </button>
        )
      )}
    </div>
  );
}

/* ─── 아이템 카드 ─── */
function ItemCardInner({ item, color, isOwner, onDelete }: {
  item: FavoriteItem;
  color: string;
  isOwner: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
        style={{ backgroundColor: color + "30" }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.title}</p>
        {item.url && (
          <p className="text-[11px] text-white/30 truncate mt-0.5">{item.url}</p>
        )}
        {item.description && (
          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{item.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        {item.url && (
          <ExternalLink size={12} className="text-white/15 group-hover:text-white/40 transition-colors" />
        )}
        {isOwner && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(item.id); }}
            className="text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </>
  );
}

function ItemCard({ item, color, isOwner, onDelete }: {
  item: FavoriteItem;
  color: string;
  isOwner: boolean;
  onDelete: (id: string) => void;
}) {
  const baseClass = "group flex items-start gap-3 rounded-2xl bg-white/5 border border-white/8 px-4 py-3 transition-colors";
  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        className={cn(baseClass, "hover:border-white/20 cursor-pointer")}>
        <ItemCardInner item={item} color={color} isOwner={isOwner} onDelete={onDelete} />
      </a>
    );
  }
  return (
    <div className={baseClass}>
      <ItemCardInner item={item} color={color} isOwner={isOwner} onDelete={onDelete} />
    </div>
  );
}
