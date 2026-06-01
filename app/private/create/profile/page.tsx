"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { createPersonal } from "@/lib/firebase/personals";
import { PERSONA_TYPES } from "@/lib/types/personal";
import type { PersonalSchema, PersonaType } from "@/lib/types/personal";
import { generatePersonalId } from "@/lib/utils";
import { registerSlug, normalizeSlug } from "@/lib/slug-registry";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";

type Step = "type" | "info";

const TYPE_ACTIVE: Partial<Record<PersonaType, string>> = {
  portfolio: "border-indigo-500 bg-indigo-500",
  record:    "border-emerald-500 bg-emerald-500",
  taste:     "border-pink-500 bg-pink-500",
  creator:   "border-amber-500 bg-amber-500",
  couple:    "border-rose-500 bg-rose-500",
};

export default function ProfileCreatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();

  const [step, setStep] = useState<Step>("type");
  const [personaType, setPersonaType] = useState<PersonaType>("portfolio");
  const [form, setForm] = useState({ name: "", role: "", tagline: "", bio: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // 로그인 필수
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?from=/private/create/profile");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const up = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.name.trim()) { setError("이름을 입력해주세요"); return; }
    setError("");
    setCreating(true);
    try {
      const id = generatePersonalId(form.name);
      const targetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/p/${id}`;
      const slugToRegister = normalizeSlug(form.name) || id;
      const regResult = await registerSlug({ slug: slugToRegister, target_url: targetUrl, owner_id: user.uid });

      const def = PERSONA_TYPES.find((t) => t.id === personaType)!;
      const now = new Date().toISOString();
      const data: PersonalSchema = {
        id,
        ownerId: user.uid,
        slug: id,
        publicSlug: regResult.final_slug,
        publicUrl: regResult.short_url,
        published: false, // 공개용은 기본 비공개로 시작 (에디터에서 발행)
        createdAt: now, updatedAt: now,
        personaType,
        themeId: "warm-ocean",
        profile: {
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          role: form.role.trim(),
          bio: form.bio.trim(),
          socials: {},
        },
        about: "",
        skills: [],
        projects: [],
        contact: { message: "궁금한 점이 있으면 편하게 연락주세요." },
        sections: def.sections,
        // universe 없음 → PersonalSite 모드로 렌더
      };
      await createPersonal(data);
      // 편집 페이지로 이동 (소개/스킬/프로젝트/소셜 등 추가 입력)
      router.push(`/private/edit/${id}`);
    } catch (err) {
      console.error(err);
      setError("생성에 실패했습니다. 다시 시도해주세요.");
      setCreating(false);
    }
  };

  if (creating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
        <p className="font-bold text-gray-800">페이지를 만들고 있어요</p>
        <p className="text-sm text-gray-400">완성되면 편집 페이지로 이동합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-5 h-14 flex items-center gap-3">
        <button onClick={() => step === "info" ? setStep("type") : router.push("/private")}
          className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className={cn("w-6 h-1.5 rounded-full transition-colors", step === "type" ? "bg-indigo-500" : "bg-indigo-200")} />
          <div className={cn("w-6 h-1.5 rounded-full transition-colors", step === "info" ? "bg-indigo-500" : "bg-gray-200")} />
        </div>
        <p className="text-sm font-semibold text-gray-500">{step === "type" ? "유형 선택" : "기본 정보"}</p>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">

        {/* ── STEP 1: 유형 선택 ── */}
        {step === "type" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">어떤 페이지를 만들까요?</h1>
              <p className="text-gray-500 text-sm">나에게 맞는 유형을 고르면 섹션이 자동으로 구성돼요</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {PERSONA_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPersonaType(t.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                    personaType === t.id
                      ? `${TYPE_ACTIVE[t.id] ?? "border-violet-500 bg-violet-500"} text-white shadow-lg scale-[1.01]`
                      : `bg-white border-gray-200 hover:border-gray-300`
                  )}
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <div className="flex-1">
                    <p className={cn("font-bold text-base", personaType === t.id ? "text-white" : "text-gray-900")}>
                      {t.label}
                    </p>
                    <p className={cn("text-sm mt-0.5", personaType === t.id ? "text-white/80" : "text-gray-500")}>
                      {t.desc}
                    </p>
                  </div>
                  {personaType === t.id && <Check size={20} className="text-white shrink-0" />}
                </button>
              ))}
            </div>

            {/* 섹션 미리보기 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">포함되는 섹션</p>
              <div className="flex flex-wrap gap-2">
                {PERSONA_TYPES.find((t) => t.id === personaType)!.sections.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold capitalize">{s}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors">
              다음 <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 2: 기본 정보 ── */}
        {step === "info" && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
                {PERSONA_TYPES.find((t) => t.id === personaType)?.emoji} {PERSONA_TYPES.find((t) => t.id === personaType)?.label}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">기본 정보를 입력해주세요</h1>
              <p className="text-gray-500 text-sm">만들고 난 뒤 편집 페이지에서 자유롭게 수정 가능해요</p>
            </div>

            {[
              { key: "name" as const, label: "이름 *", ph: "예: 김제주", required: true },
              { key: "role" as const, label: "직함/역할", ph: "예: 프론트엔드 개발자" },
              { key: "tagline" as const, label: "한 줄 소개", ph: "나를 한 문장으로 표현하면?" },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  value={form[key]}
                  onChange={(e) => up(key, e.target.value)}
                  placeholder={ph}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">자기소개 <span className="text-gray-400 font-normal">(선택)</span></label>
              <textarea
                value={form.bio}
                onChange={(e) => up("bio", e.target.value)}
                placeholder="간단한 자기소개를 써주세요. 나중에 수정 가능해요."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none resize-none text-sm"
              />
            </div>

            <div className="bg-indigo-50 rounded-2xl px-4 py-3 text-sm text-indigo-700">
              <p className="font-semibold mb-0.5">다음 단계에서 할 수 있어요</p>
              <p className="text-indigo-500 text-xs">스킬, 프로젝트, 소셜 링크, 이미지, 발행 여부 등</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={create}
              disabled={!form.name.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-colors",
                form.name.trim() ? "bg-indigo-500 hover:bg-indigo-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}>
              <Check size={18} />페이지 만들기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
