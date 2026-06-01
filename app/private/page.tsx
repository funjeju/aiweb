"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Sparkles, ArrowRight, LayoutDashboard, User, Star, Lock, Unlock } from "lucide-react";

export default function PrivateLandingPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const goPublicProfile = () => {
    // 공개용 → 로그인 필수
    if (user) router.push("/private/create");
    else router.push("/login?from=/private/create");
  };

  const goUniverse = () => {
    // 별자리 → 로그인 없이도 시작 가능
    router.push("/private/create/universe");
  };

  return (
    <div className="min-h-screen bg-[#07091a] text-white">
      {/* 상단 바 */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 h-16 flex items-center justify-between max-w-3xl mx-auto">
        <span className="font-bold text-violet-400 text-sm tracking-wide">My Page</span>
        {user && (
          <button onClick={() => router.push("/dashboard?tab=personal")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/15">
            <LayoutDashboard size={14} />내 페이지
          </button>
        )}
      </header>

      {/* Hero */}
      <section className="min-h-[45vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-8">
        <div className="inline-flex items-center gap-2 bg-violet-500/20 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-violet-500/30">
          <Sparkles size={12} />나만의 웹 공간
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          어떤 공간을<br />만들고 싶으세요?
        </h1>
        <p className="text-white/50 text-sm md:text-base max-w-sm">
          목적에 맞게 두 가지 형태 중 선택하세요
        </p>
      </section>

      {/* 두 선택지 카드 */}
      <section className="max-w-2xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* 공개용 개인 웹페이지 */}
        <button
          onClick={goPublicProfile}
          className="group relative text-left rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-400/40 transition-all duration-200 p-6 flex flex-col gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <User size={22} className="text-indigo-400" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-1.5">공개용 개인 웹페이지</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              포트폴리오·기록·취향 공유 등<br />나를 소개하는 실명 홈페이지
            </p>
          </div>

          <ul className="space-y-1.5 text-xs text-white/40">
            <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400" />프로필·소셜 링크 포함</li>
            <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400" />포트폴리오·프로젝트 등록 가능</li>
            <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400" />검색 노출·SEO 설정 지원</li>
          </ul>

          <div className="flex items-center gap-1.5 mt-auto pt-2">
            <Lock size={12} className="text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">로그인 필요</span>
          </div>

          <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={18} className="text-indigo-400" />
          </div>
        </button>

        {/* 익명 별자리 웹페이지 */}
        <button
          onClick={goUniverse}
          className="group relative text-left rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-400/40 transition-all duration-200 p-6 flex flex-col gap-4"
        >
          {/* 별자리 배경 글로우 */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-violet-500/10 blur-2xl" />
          </div>

          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <Star size={22} className="text-violet-400" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-1.5">익명 별자리 우주</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              이름·색·숫자만으로 만드는<br />나만의 감성 우주 홈페이지
            </p>
          </div>

          <ul className="space-y-1.5 text-xs text-white/40">
            <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-violet-400" />실명 없이 닉네임으로 시작</li>
            <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-violet-400" />별자리 우주 인터페이스</li>
            <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-violet-400" />갤러리·다이어리 메뉴 구성</li>
          </ul>

          <div className="flex items-center gap-1.5 mt-auto pt-2">
            <Unlock size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium">로그인 없이 시작 가능</span>
          </div>

          <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={18} className="text-violet-400" />
          </div>
        </button>
      </section>

      {/* 배경 별 느낌 점들 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.4 + 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
