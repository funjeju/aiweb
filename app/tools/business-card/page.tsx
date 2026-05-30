"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { BusinessCardPreview, type BusinessCardData } from "@/components/marketing/BusinessCardPreview";
import { VIBES } from "@/lib/types/site";
import type { ThemeId } from "@/lib/types/site";
import { trialRemaining, incrementTrial, TRIAL_LIMIT } from "@/lib/trialUsage";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, Sparkles, Lock } from "lucide-react";

const TOOL_ID = "business-card";

export default function BusinessCardTrialPage() {
  const { user } = useAuthStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<BusinessCardData>({
    name: "", category: "", phone: "", address: "", description: "",
    url: "", themeId: "warm-ocean",
  });
  const [remaining, setRemaining] = useState(TRIAL_LIMIT);

  useEffect(() => { setRemaining(trialRemaining(TOOL_ID)); }, []);

  // 로그인 사용자는 무제한, 비로그인은 체험 제한
  const blocked = !user && remaining <= 0;

  const update = (patch: Partial<BusinessCardData>) => setData((p) => ({ ...p, ...patch }));

  const download = async () => {
    if (blocked || !cardRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${data.name || "명함"}_명함.png`;
    a.click();
    if (!user) setRemaining(trialRemaining(TOOL_ID) - 1 >= 0 ? TRIAL_LIMIT - incrementTrial(TOOL_ID) : 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-5 h-14 flex items-center gap-3">
        <Link href="/" className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></Link>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-sm">디지털 명함 만들기</h1>
        </div>
        {!user && (
          <span className="text-xs text-gray-400">무료 체험 {remaining}/{TRIAL_LIMIT}회 남음</span>
        )}
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* 미리보기 */}
        <BusinessCardPreview ref={cardRef} data={data} />

        {/* 테마 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">테마</p>
          <div className="grid grid-cols-3 gap-2">
            {VIBES.map((v) => (
              <button key={v.id} onClick={() => update({ themeId: v.id as ThemeId })}
                className={cn("p-2 rounded-xl border-2 flex items-center gap-2 transition-all",
                  data.themeId === v.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200")}>
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: v.primaryColor }} />
                <span className="text-xs font-medium text-gray-700 truncate">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 입력 */}
        <div className="space-y-3">
          {[
            { k: "name" as const, label: "상호명", ph: "예: 풍차로 가는 길" },
            { k: "category" as const, label: "업종", ph: "예: 카페" },
            { k: "phone" as const, label: "전화번호", ph: "010-0000-0000" },
            { k: "address" as const, label: "주소", ph: "주소" },
            { k: "url" as const, label: "홈페이지/SNS 링크 (QR)", ph: "https://..." },
          ].map(({ k, label, ph }) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input value={data[k] || ""} onChange={(e) => update({ [k]: e.target.value })} placeholder={ph}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none" />
            </div>
          ))}
        </div>

        {blocked ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center">
            <Lock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900 mb-1">무료 체험을 모두 사용했어요</p>
            <p className="text-sm text-gray-500 mb-4">로그인하면 더 많은 마케팅 도구를 이용할 수 있어요</p>
            <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600">
              로그인하기
            </Link>
          </div>
        ) : (
          <button onClick={download} disabled={!data.name.trim()}
            className={cn("w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white",
              data.name.trim() ? "bg-indigo-500 hover:bg-indigo-600" : "bg-gray-200 text-gray-400")}>
            <Download size={18} />PNG 저장
          </button>
        )}

        {!user && !blocked && (
          <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
            <Sparkles size={11} />로그인하면 가게 정보 기반으로 더 많은 마케팅 키트를 만들 수 있어요
          </p>
        )}
      </main>
    </div>
  );
}
