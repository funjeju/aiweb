"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle, getGoogleRedirectResult } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { Sparkles, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#05060f]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/private/create/universe";
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace(from);
  }, [user, from, router]);

  useEffect(() => {
    getGoogleRedirectResult()
      .then((result) => { if (result?.user) router.replace(from); })
      .catch(() => {});
  }, [router, from]);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push(from);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "";
      if (!msg.includes("redirect")) {
        setError("Google 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#05060f]">
      {/* 별 배경 */}
      <StarfieldBg />

      {/* 카드 */}
      <div className="relative z-10 w-full max-w-xs px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-5"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 40px #7c3aed55" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">나만의 별자리 우주</h1>
          <p className="text-sm text-white/40">Google 계정으로 바로 시작하세요</p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-white/90 transition-all border border-white/15 backdrop-blur-sm hover:bg-white/10 disabled:opacity-60"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? "로그인 중..." : "Google로 계속하기"}
        </button>

        {error && (
          <p className="mt-3 text-xs text-red-400 text-center">{error}</p>
        )}

        <p className="text-center text-xs text-white/20 mt-8 leading-relaxed">
          로그인하면 나만의 별자리 우주가<br />바로 만들어져요 ✦
        </p>
      </div>
    </div>
  );
}

/* ─── 정적 별 배경 ─────────────────────────────── */

function StarfieldBg() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top: `${(i * 37 + 13) % 100}%`,
    left: `${(i * 61 + 7) % 100}%`,
    size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 1,
    opacity: 0.15 + (i % 7) * 0.08,
    delay: `${(i % 5) * 0.8}s`,
    duration: `${3 + (i % 4)}s`,
  }));

  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--op); }
          50%       { opacity: calc(var(--op) * 0.3); }
        }
      `}</style>
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 40% 30%, #1a0a3a 0%, #08030f 60%, #05060f 100%)" }} />
      {/* 중앙 글로우 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, #4f46e520 0%, transparent 70%)" }} />
      </div>
      {/* 별들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((s) => (
          <div key={s.id} className="absolute rounded-full bg-white"
            style={{
              top: s.top, left: s.left,
              width: s.size, height: s.size,
              "--op": s.opacity,
              opacity: s.opacity,
              animation: `twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}
