"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPersonalsByOwner, deletePersonal } from "@/lib/firebase/personals";
import { useAuthStore } from "@/lib/store/authStore";
import type { PersonalSchema } from "@/lib/types/personal";
import { PERSONA_TYPES } from "@/lib/types/personal";
import { Plus, Pencil, ExternalLink, Loader2, Sparkles, Trash2, ArrowLeft } from "lucide-react";

export default function PrivateDashboardPage() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [pages, setPages] = useState<PersonalSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login?from=/private/dashboard"); return; }
    getPersonalsByOwner(user.uid).then((p) => { setPages(p); setLoading(false); });
  }, [user, authLoading, router]);

  const remove = async (id: string, name: string) => {
    if (!confirm(`"${name}" 페이지를 삭제할까요?`)) return;
    await deletePersonal(id);
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const emojiFor = (t: string) => PERSONA_TYPES.find((x) => x.id === t)?.emoji || "👤";

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 text-violet-400 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-5 h-14 flex items-center justify-between">
        <Link href="/private" className="flex items-center gap-1.5 text-sm text-gray-500"><ArrowLeft size={18} />돌아가기</Link>
        <Link href="/private/create" className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600">
          <Plus size={15} />새 페이지
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">내 개인 페이지</h1>

        {pages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">아직 만든 페이지가 없어요</p>
            <p className="text-sm text-gray-500 mb-6">나만의 웹페이지를 만들어보세요</p>
            <Link href="/private/create" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-2xl font-semibold hover:bg-violet-600">
              <Plus size={18} />만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{emojiFor(p.personaType)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.profile.name || "이름 없음"}</p>
                    <p className="text-xs text-gray-400 truncate">{p.profile.tagline || PERSONA_TYPES.find((x) => x.id === p.personaType)?.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg" title="보기"><ExternalLink size={16} className="text-gray-500" /></a>
                  <Link href={`/private/edit/${p.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-700"><Pencil size={14} />편집</Link>
                  <button onClick={() => remove(p.id, p.profile.name)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="삭제"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
