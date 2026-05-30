"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { ChevronRight, Store, Sparkles, ArrowLeft, Loader2, Search, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteType } from "@/lib/types/site";
import type { KakaoPlace } from "@/lib/kakao/local";

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
}

export default function CreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("type");
  const [form, setForm] = useState<FormData>({
    siteType: "cafe",
    businessName: "",
    description: "",
    address: "",
    phone: "",
  });
  const [error, setError] = useState("");

  // 장소 후보 검색
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<KakaoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);

  const handleTypeSelect = (type: SiteType) => {
    setForm((p) => ({ ...p, siteType: type }));
    setStep("info");
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    setCandidates([]);
    try {
      const res = await fetch("/api/place-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const { places } = await res.json();
      setCandidates(places || []);
    } catch {
      setCandidates([]);
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (place: KakaoPlace) => {
    setSelectedPlace(place);
    setForm((p) => ({
      ...p,
      businessName: place.name,
      address: place.address || p.address,
      phone: place.phone || p.phone,
    }));
    setCandidates([]);
  };

  const clearSelection = () => {
    setSelectedPlace(null);
  };

  const handleGenerate = async () => {
    if (!form.businessName.trim()) {
      setError("상호명을 입력하거나 가게를 검색해주세요");
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
          ownerId: user?.uid ?? "anonymous",
          coordinates: selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : undefined,
          placeUrl: selectedPlace?.placeUrl,
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
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">AI가 홈페이지를 만들고 있어요</h2>
            <p className="text-gray-500 text-sm">실제 정보를 검색해 채우는 중 · 보통 30초 내 완성</p>
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
          <button onClick={() => setStep("type")} className="flex items-center gap-1.5 text-sm text-gray-500 mb-8">
            <ArrowLeft size={16} />업종 선택
          </button>
        )}

        {step === "type" && (
          <>
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">업종 선택</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">어떤 가게인가요?</h1>
              <p className="text-gray-500 text-sm">업종에 맞는 최적화된 홈페이지를 만들어드려요</p>
            </div>
            <div className="space-y-3">
              {SITE_TYPES.map((type) => (
                <button key={type.id} onClick={() => handleTypeSelect(type.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left">
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
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">가게 찾기</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">가게를 검색하세요</h1>
              <p className="text-gray-500 text-sm">상호명으로 찾으면 주소·전화·위치를 자동으로 채워드려요</p>
            </div>

            <div className="space-y-4">
              {/* 가게 검색 */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="예: 우진해장국"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className={cn(
                      "flex-shrink-0 px-5 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-colors",
                      searching || !searchQuery.trim() ? "bg-gray-100 text-gray-400" : "bg-indigo-500 text-white hover:bg-indigo-600"
                    )}
                  >
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    검색
                  </button>
                </div>

                {/* 후보 목록 */}
                {candidates.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {candidates.map((place, i) => (
                      <button
                        key={`${place.placeUrl}-${i}`}
                        onClick={() => selectPlace(place)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-900">{place.name}</p>
                          {place.category && <span className="text-[11px] text-gray-400 flex-shrink-0">{place.category}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={11} className="flex-shrink-0" />{place.address}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {searched && !searching && candidates.length === 0 && !selectedPlace && (
                  <p className="text-xs text-gray-400 mt-2">검색 결과가 없어요. 아래에 직접 입력하셔도 됩니다.</p>
                )}
              </div>

              {/* 선택된 장소 */}
              {selectedPlace && (
                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{selectedPlace.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedPlace.address}</p>
                    {selectedPlace.phone && <p className="text-xs text-gray-500">{selectedPlace.phone}</p>}
                  </div>
                  <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">변경</button>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">직접 입력 / 수정</p>

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">상호명 <span className="text-red-500">*</span></label>
                <input type="text" placeholder="상호명" value={form.businessName}
                  onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400 mb-3" />

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">소개 문구</label>
                <textarea placeholder="가게를 한 줄로 소개해주세요 (비우면 AI가 채웁니다)" value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400 resize-none mb-3" />

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">전화번호</label>
                <input type="tel" placeholder="010-0000-0000" value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400 mb-3" />

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">주소</label>
                <input type="text" placeholder="주소" value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-900 placeholder-gray-400" />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button onClick={handleGenerate} disabled={!form.businessName.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-base mt-2",
                  form.businessName.trim() ? "bg-indigo-500 hover:bg-indigo-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}>
                <Sparkles size={18} />AI로 홈페이지 만들기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
