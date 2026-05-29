"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Upload, Store, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteType } from "@/lib/types/site";

const SITE_TYPES: Array<{ id: SiteType; label: string; emoji: string; desc: string }> = [
  { id: "cafe", label: "카페", emoji: "☕", desc: "카페, 베이커리, 디저트" },
  { id: "restaurant", label: "식당", emoji: "🍽️", desc: "한식, 중식, 양식, 이자카야" },
  { id: "beauty", label: "미용실 / 네일", emoji: "✂️", desc: "헤어, 네일, 피부관리" },
  { id: "stay", label: "숙박", emoji: "🏡", desc: "펜션, 게스트하우스, 풀빌라" },
  { id: "general", label: "기타", emoji: "🏪", desc: "그 외 모든 업종" },
];

type Step = "type" | "info" | "generating";

interface FormData {
  siteType: SiteType;
  businessName: string;
  description: string;
  address: string;
  phone: string;
  naverPlaceUrl: string;
  instagramUrl: string;
}

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [form, setForm] = useState<FormData>({
    siteType: "cafe",
    businessName: "",
    description: "",
    address: "",
    phone: "",
    naverPlaceUrl: "",
    instagramUrl: "",
  });
  const [error, setError] = useState("");

  const handleTypeSelect = (type: SiteType) => {
    setForm((p) => ({ ...p, siteType: type }));
    setStep("info");
  };

  const handleGenerate = async () => {
    if (!form.businessName.trim()) {
      setError("상호명을 입력해주세요");
      return;
    }
    setError("");
    setStep("generating");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          category: SITE_TYPES.find((t) => t.id === form.siteType)?.label,
          description: form.description,
          address: form.address,
          phone: form.phone,
          ownerId: "demo-user", // TODO: replace with auth user
        }),
      });

      if (!res.ok) throw new Error("생성 실패");
      const { siteId } = await res.json();
      router.push(`/editor/${siteId}`);
    } catch {
      setError("사이트 생성에 실패했습니다. 다시 시도해주세요.");
      setStep("info");
    }
  };

  if (step === "generating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              AI가 홈페이지를 만들고 있어요
            </h2>
            <p className="text-gray-500 text-sm">보통 30초 내로 완성됩니다</p>
          </div>
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        {step === "info" && (
          <button
            onClick={() => setStep("type")}
            className="flex items-center gap-1.5 text-sm text-gray-500 mb-8"
          >
            <ArrowLeft size={16} />
            업종 선택
          </button>
        )}

        {step === "type" && (
          <>
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">업종 선택</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                어떤 가게인가요?
              </h1>
              <p className="text-gray-500 text-sm">업종에 맞는 최적화된 홈페이지를 만들어드려요</p>
            </div>

            <div className="space-y-3">
              {SITE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{type.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{type.label}</p>
                      <p className="text-xs text-gray-500">{type.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </>
        )}

        {step === "info" && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">기본 정보</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                가게 정보를 알려주세요
              </h1>
              <p className="text-gray-500 text-sm">입력할수록 더 좋은 홈페이지가 만들어져요</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  상호명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 풍차로 가는 길"
                  value={form.businessName}
                  onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  소개 문구
                </label>
                <textarea
                  placeholder="가게를 한 줄로 소개해주세요"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  전화번호
                </label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  주소
                </label>
                <input
                  type="text"
                  placeholder="주소를 입력하세요"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">선택 입력</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    네이버 플레이스 URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://naver.me/..."
                    value={form.naverPlaceUrl}
                    onChange={(e) => setForm((p) => ({ ...p, naverPlaceUrl: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleGenerate}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base mt-4",
                  form.businessName.trim() ? "bg-indigo-500 hover:bg-indigo-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
                disabled={!form.businessName.trim()}
              >
                <Sparkles size={18} />
                AI로 홈페이지 만들기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
