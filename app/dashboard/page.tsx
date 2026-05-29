"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSitesByOwner, deleteSite } from "@/lib/firebase/sites";
import { useAuthStore } from "@/lib/store/authStore";
import { logout } from "@/lib/firebase/auth";
import type { SiteSchema } from "@/lib/types/site";
import { getAppUrl } from "@/lib/utils";
import { Plus, Globe, Pencil, ExternalLink, Sparkles, LogOut, User, MoreVertical, Trash2, Layers } from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [sites, setSites] = useState<SiteSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    getSitesByOwner(user.uid).then((s) => {
      setSites(s);
      setLoading(false);
    });
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h1 className="text-lg font-bold text-gray-900">AI 웹빌더</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-bold text-gray-900">AI 웹빌더</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            <Plus size={16} />
            새 홈페이지
          </Link>
          <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg" title="로그아웃">
            <LogOut size={18} className="text-gray-500" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {user && (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                : <User size={16} className="text-indigo-500" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user.displayName || user.email}</p>
              <p className="text-xs text-gray-400">내 홈페이지 {sites.length}개</p>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-6">내 홈페이지</h2>

        {sites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">아직 홈페이지가 없어요</h3>
            <p className="text-gray-500 text-sm mb-6">AI로 3분 안에 첫 홈페이지를 만들어보세요</p>
            <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-2xl font-semibold hover:bg-indigo-600 transition-colors">
              <Plus size={18} />홈페이지 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <SiteCard
                key={site.siteId}
                site={site}
                onDelete={() => setSites((prev) => prev.filter((s) => s.siteId !== site.siteId))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SiteCard({ site, onDelete }: { site: SiteSchema; onDelete: () => void }) {
  const appUrl = getAppUrl();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${site.merchantInfo.name}" 홈페이지를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await deleteSite(site.siteId);
      onDelete();
    } catch {
      setDeleting(false);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 truncate">{site.merchantInfo.name}</p>
          {site.published ? (
            <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Globe size={10} />공개중
            </span>
          ) : (
            <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">비공개</span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{site.merchantInfo.category}</p>
      </div>
      <div className="flex items-center gap-1 ml-4">
        <a href={`${appUrl}/site/${site.siteId}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg" title="미리보기">
          <ExternalLink size={16} className="text-gray-500" />
        </a>
        <Link href={`/editor/${site.siteId}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-700">
          <Pencil size={14} />편집
        </Link>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={deleting}>
            <MoreVertical size={16} className="text-gray-500" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                <Link href={`/editor/${site.siteId}/brand-kit`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Layers size={14} />마케팅 키트
                </Link>
                <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
