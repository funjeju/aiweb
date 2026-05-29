"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSiteById, updateSite } from "@/lib/firebase/sites";
import { uploadSiteImage } from "@/lib/firebase/storage";
import type { SiteSchema } from "@/lib/types/site";
import { ArrowLeft, Upload, Loader2, CheckCircle2, Sparkles, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedItem {
  id: string;
  type: string;
  title: string;
  caption: string;
  suggestedSection: string;
  confidence: number;
  createdAt: string;
  applied: boolean;
  imageUrl?: string;
}

const TYPE_LABELS: Record<string, string> = {
  menu: "🍽 신메뉴",
  view: "🌅 뷰/분위기",
  event: "🎉 이벤트",
  space: "🏪 공간",
  other: "📸 기타",
};

const SECTION_LABELS: Record<string, string> = {
  hero: "대표 이미지",
  featured: "추천 섹션",
  gallery: "갤러리",
  announcement: "공지",
};

export default function LiveFeedPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<SiteSchema | null>(null);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSiteById(siteId).then((s) => { if (s) setSite(s); });
    loadFeeds();
  }, [siteId]);

  const loadFeeds = async () => {
    const res = await fetch(`/api/live-feed?siteId=${siteId}`);
    const { feeds } = await res.json();
    setFeeds(feeds || []);
  };

  const handleUpload = async (file: File) => {
    if (!site) return;
    setUploading(true);
    try {
      const imageUrl = await uploadSiteImage(siteId, "gallery", file);
      setAnalyzing(true);
      const form = new FormData();
      form.append("file", file);
      form.append("siteId", siteId);
      const res = await fetch("/api/live-feed", { method: "POST", body: form });
      const { feedId, analysis } = await res.json();
      const newFeed: FeedItem = { id: feedId, imageUrl, applied: false, createdAt: new Date().toISOString(), ...analysis };
      setFeeds((prev) => [newFeed, ...prev]);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const applyToSite = async (feed: FeedItem) => {
    if (!site || !feed.imageUrl) return;
    const patch: Partial<SiteSchema> = {};
    if (feed.suggestedSection === "hero") {
      patch.contentAssets = { ...site.contentAssets, heroImage: feed.imageUrl };
    } else if (feed.suggestedSection === "gallery") {
      patch.contentAssets = { ...site.contentAssets, galleryImages: [...site.contentAssets.galleryImages, feed.imageUrl] };
    }
    if (Object.keys(patch).length > 0) {
      await updateSite(siteId, patch);
      setSite((s) => s ? { ...s, ...patch } : s);
    }
    setFeeds((prev) => prev.map((f) => f.id === feed.id ? { ...f, applied: true } : f));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href={`/editor/${siteId}`} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900">Live Feed</h1>
          <p className="text-xs text-gray-400">사진 업로드 → AI 분석 → 홈페이지 반영</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* 업로드 영역 */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="rounded-3xl border-2 border-dashed border-gray-300 p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
        >
          {uploading || analyzing ? (
            <>
              <Loader2 size={32} className="text-indigo-400 animate-spin" />
              <p className="text-sm font-semibold text-gray-600">{analyzing ? "AI가 사진을 분석 중이에요..." : "업로드 중..."}</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Upload size={24} className="text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700">사진 업로드</p>
              <p className="text-xs text-gray-400 text-center">신메뉴, 오늘 분위기, 이벤트 사진을 올리면<br/>AI가 자동으로 홈페이지 반영을 제안해요</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />

        {/* 피드 목록 */}
        {feeds.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">최근 업로드</p>
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div key={feed.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="flex gap-3 p-4">
                    {feed.imageUrl ? (
                      <img src={feed.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold" style={{ color: "#6366F1" }}>{TYPE_LABELS[feed.type] || feed.type}</span>
                        <span className="text-xs text-gray-400">→ {SECTION_LABELS[feed.suggestedSection] || feed.suggestedSection}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{feed.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{feed.caption}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Sparkles size={12} className="text-indigo-400" />
                      <span className="text-xs text-gray-400">신뢰도 {Math.round(feed.confidence * 100)}%</span>
                    </div>
                    {feed.applied ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <CheckCircle2 size={12} />반영됨
                      </span>
                    ) : (
                      <button
                        onClick={() => applyToSite(feed)}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-700"
                      >
                        홈페이지에 반영 →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
