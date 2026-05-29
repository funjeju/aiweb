"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle, signInWithEmail, getGoogleRedirectResult } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const { user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 이미 로그인된 상태면 바로 이동
  useEffect(() => {
    if (user) router.replace(from);
  }, [user, from, router]);

  // redirect 방식으로 돌아왔을 때 결과 처리
  useEffect(() => {
    getGoogleRedirectResult()
      .then((result) => {
        if (result?.user) router.replace(from);
      })
      .catch(() => {});
  }, [router, from]);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      // popup 성공 시 바로 이동, redirect 시엔 페이지가 떠남
      router.push(from);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "";
      if (!msg.includes("redirect")) {
        setError("Google 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setLoading(false);
      }
      // redirect 진행 중이면 loading 유지 (페이지 전환 중)
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(email, password);
      router.push(from);
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="text-sm text-gray-500 mt-1">AI 웹빌더에 오신 것을 환영합니다</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-4">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google로 계속하기
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input type="email" placeholder="이메일" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-sm" />
            <input type="password" placeholder="비밀번호" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-sm" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white transition-colors",
                loading || !email || !password ? "bg-gray-200 text-gray-400" : "bg-indigo-500 hover:bg-indigo-600"
              )}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              로그인
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-indigo-500 font-semibold">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
