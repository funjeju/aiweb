"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, User, Camera, Heart, Palette } from "lucide-react";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function PrivateLandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-violet-50 to-white">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Sparkles size={12} />나만의 웹페이지
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
          나를 표현하는<br /><span className="text-violet-500">디지털 공간</span>
        </h1>
        <p className="text-gray-500 text-base md:text-lg mb-9 max-w-md leading-relaxed">
          몇 가지 질문에 답하면 AI가 나에게 꼭 맞는<br />개인 홈페이지를 만들어드려요.
        </p>
        <Link href="/private/create" className="inline-flex items-center gap-2 bg-violet-500 text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-violet-600 transition-colors shadow-lg shadow-violet-200">
          나만의 웹페이지 만들기 <ArrowRight size={18} />
        </Link>
        <button onClick={() => scrollToId("how")} className="mt-10 text-sm text-gray-400 hover:text-gray-600">어떻게 만들어지나요? ↓</button>
      </section>

      {/* How */}
      <section id="how" className="py-24 px-6 max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500 mb-3 text-center">How it works</p>
        <h2 className="text-3xl font-bold text-center mb-12">3단계면 충분해요</h2>
        <div className="space-y-6">
          {[
            { n: "01", t: "유형 선택", d: "포트폴리오·기록·취향·크리에이터 중 나에게 맞는 유형을 골라요" },
            { n: "02", t: "몇 가지 질문", d: "이름·소개·작업물 등 기본 정보를 입력하면 AI가 구성을 짜요" },
            { n: "03", t: "발행", d: "원페이지 홈페이지가 완성되면 링크로 공유하세요" },
          ].map((s) => (
            <div key={s.n} className="flex gap-5 items-start p-5 rounded-2xl bg-violet-50/50">
              <span className="text-2xl font-bold text-violet-300">{s.n}</span>
              <div>
                <p className="font-bold text-lg">{s.t}</p>
                <p className="text-gray-500 text-sm mt-1">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Types */}
      <section className="py-24 px-6 bg-violet-50/40">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500 mb-3 text-center">Types</p>
          <h2 className="text-3xl font-bold text-center mb-12">어떤 공간이든</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <User className="w-6 h-6" />, t: "포트폴리오", d: "개발자·디자이너·창작자" },
              { icon: <Camera className="w-6 h-6" />, t: "기록형", d: "일상·생각 기록" },
              { icon: <Heart className="w-6 h-6" />, t: "취향 공유", d: "음악·영화·책" },
              { icon: <Palette className="w-6 h-6" />, t: "크리에이터", d: "콘텐츠·작품" },
            ].map((x, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white border border-violet-100">
                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-500 flex items-center justify-center mb-3">{x.icon}</div>
                <p className="font-bold">{x.t}</p>
                <p className="text-sm text-gray-500 mt-0.5">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-lg mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-10">
          <h2 className="text-2xl font-bold text-white mb-2">지금 시작해보세요</h2>
          <p className="text-white/80 text-sm mb-7">무료로 나만의 페이지를 만들 수 있어요</p>
          <Link href="/private/create" className="inline-flex items-center gap-2 bg-white text-violet-600 font-bold px-7 py-3.5 rounded-2xl hover:bg-gray-50 transition-colors">
            <Sparkles size={17} />만들기 시작
          </Link>
        </div>
      </section>
    </div>
  );
}
