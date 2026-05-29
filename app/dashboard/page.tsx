"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSitesByOwner } from "@/lib/firebase/sites";
import { useAuthStore } from "@/lib/store/authStore";
import { logout } from "@/lib/firebase/auth";
import type { SiteSchema } from "@/lib/types/site";
import { Plus, Globe, Pencil, ExternalLink, Sparkles, LogOut, User } from "lucide-react";

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
            {sites.map((site) => <SiteCard key={site.siteId} site={site} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function SiteCard({ site }: { site: SiteSchema }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 truncate">{site.merchantInfo.name}</p>
          {site.published && (
            <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Globe size={10} />공개중
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{site.merchantInfo.category}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <a href={`${appUrl}/site/${site.siteId}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg">
          <ExternalLink size={16} className="text-gray-500" />
        </a>
        <Link href={`/editor/${site.siteId}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-700">
          <Pencil size={14} />편집
        </Link>
      </div>
    </div>
  );
}
