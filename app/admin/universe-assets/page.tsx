"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { getCustomAssets, saveCustomAsset, deleteCustomAsset, toggleAssetFree } from "@/lib/firebase/assets";
import { DEFAULT_ASSETS } from "@/lib/types/asset";
import type { UniverseAsset, AssetAnimationType, AssetCategory } from "@/lib/types/asset";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, Loader2, Lock, Unlock, Check } from "lucide-react";

const ANIM_TYPES: AssetAnimationType[] = ["float", "drift", "orbit", "pulse"];
const CATEGORIES: AssetCategory[] = ["character", "object", "effect"];
const CATEGORY_LABEL: Record<AssetCategory, string> = { character: "캐릭터", object: "오브젝트", effect: "이펙트" };

export default function UniverseAssetsAdminPage() {
  const { profile, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [customAssets, setCustomAssets] = useState<UniverseAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "", name: "", emoji: "",
    category: "object" as AssetCategory,
    animationType: "float" as AssetAnimationType,
    isFree: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== "admin") { router.replace("/"); return; }
    getCustomAssets().then((a) => { setCustomAssets(a); setLoading(false); });
  }, [profile, authLoading, router]);

  const handleSave = async () => {
    if (!form.id || !form.name || !form.emoji) return;
    setSaving(true);
    try {
      await saveCustomAsset(form);
      setCustomAssets((prev) => {
        const idx = prev.findIndex((a) => a.id === form.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = { ...form, isDefault: false }; return n; }
        return [...prev, { ...form, isDefault: false }];
      });
      setShowForm(false);
      setForm({ id: "", name: "", emoji: "", category: "object", animationType: "float", isFree: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await deleteCustomAsset(id);
    setCustomAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggleFree = async (id: string, current: boolean) => {
    await toggleAssetFree(id, !current);
    setCustomAssets((prev) => prev.map((a) => a.id === id ? { ...a, isFree: !current } : a));
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>;
  }

  const allAssets = [...DEFAULT_ASSETS, ...customAssets];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin")} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">우주 에셋 관리</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600">
          <Plus size={15} />에셋 추가
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* 기본 에셋 */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">기본 에셋 (내장, 전체 무료)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEFAULT_ASSETS.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-3 py-3 flex items-center gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                  <p className="text-xs text-gray-400">{CATEGORY_LABEL[a.category]} · {a.animationType}</p>
                </div>
                <span className="text-xs text-green-500 font-semibold">무료</span>
              </div>
            ))}
          </div>
        </div>

        {/* 커스텀 에셋 */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            커스텀 에셋 ({customAssets.length}개)
          </p>
          {customAssets.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">아직 추가된 커스텀 에셋이 없어요.</div>
          ) : (
            <div className="space-y-2">
              {customAssets.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                    <p className="text-xs text-gray-400">{CATEGORY_LABEL[a.category]} · {a.animationType} · ID: {a.id}</p>
                  </div>
                  <button onClick={() => handleToggleFree(a.id, a.isFree)}
                    className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                      a.isFree ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")}>
                    {a.isFree ? <><Unlock size={11} />무료</> : <><Lock size={11} />유료</>}
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 에셋 추가 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900">에셋 추가</h2>
            {([
              ["id", "ID (영문, 예: space-cat)"],
              ["name", "이름 (예: 우주 고양이)"],
              ["emoji", "이모지 (예: 🐱)"],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-violet-400 focus:outline-none" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as AssetCategory }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">애니메이션</label>
                <select value={form.animationType} onChange={(e) => setForm((p) => ({ ...p, animationType: e.target.value as AssetAnimationType }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none">
                  {ANIM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFree} onChange={(e) => setForm((p) => ({ ...p, isFree: e.target.checked }))}
                className="rounded" />
              <span className="text-sm text-gray-700">무료 에셋</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving || !form.id || !form.name || !form.emoji}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 disabled:opacity-40">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}저장
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
