"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { Sparkles, Radio, Map as MapIcon, Wand2, Video, LayoutDashboard, LogIn, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLiveFeed } from "@/components/main/MainLiveFeed";
import { MainMap } from "@/components/main/MainMap";
import { MainAiTools } from "@/components/main/MainAiTools";
import { MainCctv } from "@/components/main/MainCctv";

type MainTab = "feed" | "map" | "tools" | "cctv";

const TABS: Array<{ id: MainTab; label: string; icon: React.ReactNode }> = [
  { id: "feed", label: "Live Feed", icon: <Radio size={18} /> },
  { id: "map", label: "Map", icon: <MapIcon size={18} /> },
  { id: "tools", label: "AI Tools", icon: <Wand2 size={18} /> },
  { id: "cctv", label: "CCTV", icon: <Video size={18} /> },
];

export default function MainPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<MainTab>("feed");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 상단 바: 로고 + 로그인/대시보드 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">제주 로컬</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">
                  <LayoutDashboard size={15} />대시보드
                </Link>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className="w-8 h-8" />
                    : <User size={15} className="text-indigo-500" />}
                </div>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                <LogIn size={15} />로그인
              </Link>
            )}
          </div>
        </div>

        {/* 네비게이션 탭 */}
        <div className="max-w-3xl mx-auto px-5">
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors",
                  tab === t.id ? "text-indigo-600 border-indigo-500" : "text-gray-400 border-transparent hover:text-gray-600"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-6">
        {tab === "feed" && <MainLiveFeed />}
        {tab === "map" && <MainMap />}
        {tab === "tools" && <MainAiTools />}
        {tab === "cctv" && <MainCctv />}
      </main>
    </div>
  );
}
