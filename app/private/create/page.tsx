"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { createPersonal } from "@/lib/firebase/personals";
import { PERSONA_TYPES } from "@/lib/types/personal";
import type { PersonaType, PersonalSchema } from "@/lib/types/personal";
import { generatePersonalId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";

type Step = "type" | "info" | "creating";

export default function PrivateCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("type");
  const [personaType, setPersonaType] = useState<PersonaType>("portfolio");
  const [form, setForm] = useState({
    name: "", tagline: "", role: "", bio: "", about: "",
    skills: "", email: "", github: "", instagram: "", linkedin: "",
  });
  const [projects, setProjects] = useState<Array<{ title: string; description: string; tags: string; link: string }>>([
    { title: "", description: "", tags: "", link: "" },
  ]);
  const [error, setError] = useState("");

  const up = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.name.trim()) { setError("이름을 입력해주세요"); return; }
    setError("");
    setStep("creating");
    try {
      const id = generatePersonalId(form.name);
      const def = PERSONA_TYPES.find((t) => t.id === personaType)!;
      const now = new Date().toISOString();
      const data: PersonalSchema = {
        id, ownerId: user?.uid ?? "anonymous", slug: id, published: true,
        createdAt: now, updatedAt: now,
        personaType, themeId: "warm-ocean",
        profile: {
          name: form.name, tagline: form.tagline, role: form.role, bio: form.bio,
          socials: {
            github: form.github || undefined,
            instagram: form.instagram || undefined,
            linkedin: form.linkedin || undefined,
            email: form.email || undefined,
          },
        },
        about: form.about,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        projects: projects
          .filter((p) => p.title.trim())
          .map((p) => ({ id: crypto.randomUUID(), title: p.title, description: p.description, tags: p.tags, link: p.link || undefined })),
        contact: { email: form.email || undefined, message: "궁금한 점이 있으면 편하게 연락주세요." },
        sections: def.sections,
      };
      await createPersonal(data);
      router.push(`/p/${id}`);
    } catch (err) {
      console.error("personal create failed:", err);
      setError("생성에 실패했습니다. 다시 시도해주세요.");
      setStep("info");
    }
  };

  if (step === "creating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 bg-white">
        <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-violet-500 animate-pulse" />
        </div>
        <p className="font-bold text-lg">나만의 페이지를 만들고 있어요</p>
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <button onClick={() => step === "info" ? setStep("type") : router.push("/private")} className="flex items-center gap-1.5 text-sm text-gray-500 mb-8">
          <ArrowLeft size={16} />{step === "info" ? "유형 선택" : "돌아가기"}
        </button>

        {step === "type" && (
          <>
            <h1 className="text-2xl font-bold mb-2">어떤 공간을 만들까요?</h1>
            <p className="text-gray-500 text-sm mb-8">유형에 맞는 구성으로 만들어드려요</p>
            <div className="space-y-3">
              {PERSONA_TYPES.map((t) => (
                <button key={t.id} onClick={() => { setPersonaType(t.id); setStep("info"); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{t.emoji}</span>
                    <div>
                      <p className="font-semibold">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
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
            <h1 className="text-2xl font-bold mb-2">나를 소개해주세요</h1>
            <p className="text-gray-500 text-sm mb-8">입력할수록 풍성한 페이지가 만들어져요</p>
            <div className="space-y-4">
              {([
                ["name", "이름 *", "예: 김제주"],
                ["tagline", "한 줄 소개", "예: 프론트엔드 개발자 | 웹으로 가치를 만드는 사람"],
                ["role", "직함/역할", "예: Frontend Developer"],
              ] as const).map(([k, label, ph]) => (
                <div key={k}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input value={form[k]} onChange={(e) => up(k, e.target.value)} placeholder={ph}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">자기소개</label>
                <textarea value={form.bio} onChange={(e) => up("bio", e.target.value)} rows={3} placeholder="간단한 소개를 적어주세요"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">About (상세 소개)</label>
                <textarea value={form.about} onChange={(e) => up("about", e.target.value)} rows={3} placeholder="더 자세한 이야기"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">스킬 (쉼표로 구분)</label>
                <input value={form.skills} onChange={(e) => up("skills", e.target.value)} placeholder="HTML, CSS, React, Sass"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none" />
              </div>

              {/* 프로젝트 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">프로젝트 / 작업물</label>
                  <button onClick={() => setProjects((p) => [...p, { title: "", description: "", tags: "", link: "" }])}
                    className="text-xs text-violet-500 font-semibold flex items-center gap-1"><Plus size={12} />추가</button>
                </div>
                <div className="space-y-3">
                  {projects.map((proj, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input value={proj.title} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                          placeholder="프로젝트 이름" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                        {projects.length > 1 && (
                          <button onClick={() => setProjects((p) => p.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                        )}
                      </div>
                      <input value={proj.description} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                        placeholder="설명" className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                      <div className="flex gap-2">
                        <input value={proj.tags} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, tags: e.target.value } : x))}
                          placeholder="태그 (React / Sass)" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                        <input value={proj.link} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, link: e.target.value } : x))}
                          placeholder="링크 URL" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 연락/소셜 */}
              <div className="grid grid-cols-2 gap-3">
                {([["email", "이메일"], ["github", "GitHub URL"], ["instagram", "Instagram URL"], ["linkedin", "LinkedIn URL"]] as const).map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input value={form[k]} onChange={(e) => up(k, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button onClick={create} disabled={!form.name.trim()}
                className={cn("w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white mt-2",
                  form.name.trim() ? "bg-violet-500 hover:bg-violet-600" : "bg-gray-200 text-gray-400")}>
                <Sparkles size={18} />내 페이지 만들기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
