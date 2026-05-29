"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSitesByOwner } from "@/lib/firebase/sites";
import type { SiteSchema } from "@/lib/types/site";
import { Plus, Globe, Pencil, ExternalLink, Sparkles } from "lucide-react";

const DEMO_OWNER_ID = "demo-user";

export default function DashboardPage() {
  const [sites, setSites] = useState<SiteSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSitesByOwner(DEMO_OWNER_ID).then((s) => {
      setSites(s);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-bold text-gray-900">AI 웹빌더</h1>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors"
        >
          <Plus size={16} />
          새 홈페이지
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">내 홈페이지</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              아직 홈페이지가 없어요
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              AI로 3분 안에 첫 홈페이지를 만들어보세요
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-2xl font-semibold hover:bg-indigo-600 transition-colors"
            >
              <Plus size={18} />
              홈페이지 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <SiteCard key={site.siteId} site={site} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SiteCard({ site }: { site: SiteSchema }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/site/${site.siteId}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 truncate">{site.merchantInfo.name}</p>
          {site.published && (
            <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Globe size={10} />
              공개중
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{site.merchantInfo.category}</p>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="미리보기"
        >
          <ExternalLink size={16} className="text-gray-500" />
        </a>
        <Link
          href={`/editor/${site.siteId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-700"
        >
          <Pencil size={14} />
          편집
        </Link>
      </div>
    </div>
  );
}
