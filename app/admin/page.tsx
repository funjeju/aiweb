import Link from "next/link";
import { Sparkles, ChevronRight, Store, Clock, Smartphone, Star } from "lucide-react";

export default function AdminLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-16 pb-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles size={12} />
            AI 웹빌더 · 소상공인 전용
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            가게 홈페이지
            <br />
            <span className="text-yellow-300">3분</span>이면 완성
          </h1>
          <p className="text-white/85 text-base mb-8 leading-relaxed">
            상호명만 입력하면 AI가 알아서 만들어드려요.
            <br />
            디자인 걱정 없이, 바로 쓸 수 있는 홈페이지.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-2xl text-base hover:bg-gray-50 transition-colors shadow-lg"
          >
            무료로 만들기
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">왜 AI 웹빌더인가요?</h2>
        <div className="space-y-5">
          {[
            { icon: <Clock className="w-5 h-5 text-indigo-500" />, title: "3분 완성", desc: "상호명 · 업종 · 전화번호만 입력하면 AI가 즉시 완성" },
            { icon: <Smartphone className="w-5 h-5 text-indigo-500" />, title: "모바일 최적화", desc: "스마트폰에서 완벽하게 보이는 디자인 자동 적용" },
            { icon: <Store className="w-5 h-5 text-indigo-500" />, title: "메뉴판도 자동 생성", desc: "사진 한 장으로 메뉴판 이미지, SNS 카드 자동 생성" },
            { icon: <Star className="w-5 h-5 text-indigo-500" />, title: "디자인 실패 없음", desc: "검증된 블록 조합으로 누가 만들어도 예쁜 결과물" },
          ].map((f, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">{f.icon}</div>
              <div>
                <p className="font-semibold text-gray-900 mb-0.5">{f.title}</p>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Industry types */}
      <section className="px-6 pb-16 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">어떤 업종이든 OK</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: "☕", label: "카페 · 베이커리" },
            { emoji: "🍽️", label: "식당 · 분식" },
            { emoji: "✂️", label: "미용실 · 네일" },
            { emoji: "🏡", label: "펜션 · 숙박" },
            { emoji: "💆", label: "마사지 · 피부관리" },
            { emoji: "🏪", label: "그 외 모든 업종" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white">
              <span className="text-xl">{t.emoji}</span>
              <p className="text-sm font-medium text-gray-700">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-lg mx-auto text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">지금 바로 시작하세요</h2>
          <p className="text-white/80 text-sm mb-6">신용카드 없이 무료로 만들 수 있어요</p>
          <Link href="/create" className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-colors">
            <Sparkles size={18} />무료로 만들기
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-100">
        <p>AI 웹빌더 · 소상공인 홈페이지 자동 생성 서비스</p>
      </footer>
    </div>
  );
}
