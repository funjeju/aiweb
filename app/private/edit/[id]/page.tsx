"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPersonalById, updatePersonal } from "@/lib/firebase/personals";
import { SECTION_LABEL } from "@/lib/types/personal";
import type { PersonalSchema, PersonalSection, PersonalProject } from "@/lib/types/personal";
import { VIBES } from "@/lib/types/site";
import type { ThemeId } from "@/lib/types/site";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Loader2, Plus, Trash2, ExternalLink, Eye } from "lucide-react";

type ProjForm = { id: string; title: string; description: string; tags: string; link: string };

export default function PrivateEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [base, setBase] = useState<PersonalSchema | null>(null);
  const [form, setForm] = useState({
    name: "", tagline: "", role: "", bio: "", about: "",
    skills: "", email: "", phone: "", github: "", instagram: "", linkedin: "",
  });
  const [projects, setProjects] = useState<ProjForm[]>([]);
  const [themeId, setThemeId] = useState<ThemeId>("warm-ocean");
  const [sections, setSections] = useState<PersonalSection[]>([]);

  useEffect(() => {
    getPersonalById(id).then((p) => {
      if (!p) { setNotFound(true); setLoading(false); return; }
      setBase(p);
      setForm({
        name: p.profile.name || "", tagline: p.profile.tagline || "", role: p.profile.role || "",
        bio: p.profile.bio || "", about: p.about || "", skills: (p.skills || []).join(", "),
        email: p.contact?.email || "", phone: p.contact?.phone || "",
        github: p.profile.socials?.github || "", instagram: p.profile.socials?.instagram || "",
        linkedin: p.profile.socials?.linkedin || "",
      });
      setProjects((p.projects || []).map((pr) => ({ id: pr.id, title: pr.title, description: pr.description, tags: pr.tags, link: pr.link || "" })));
      setThemeId(p.themeId);
      setSections(p.sections);
      setLoading(false);
    });
  }, [id]);

  const up = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!base) return;
    setSaving(true);
    setSaved(false);
    try {
      const cleanProjects: PersonalProject[] = projects.filter((p) => p.title.trim()).map((p) => ({
        id: p.id, title: p.title, description: p.description, tags: p.tags, link: p.link || undefined,
      }));
      await updatePersonal(id, {
        themeId,
        sections,
        profile: {
          ...base.profile,
          name: form.name, tagline: form.tagline, role: form.role, bio: form.bio,
          socials: { github: form.github || undefined, instagram: form.instagram || undefined, linkedin: form.linkedin || undefined, email: form.email || undefined },
        },
        about: form.about,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        projects: cleanProjects,
        contact: { email: form.email || undefined, phone: form.phone || undefined, message: base.contact?.message || "" },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("personal update failed:", e);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (s: PersonalSection) => {
    if (s === "hero") return; // Hero는 필수
    setSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 text-violet-400 animate-spin" /></div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center text-gray-500">페이지를 찾을 수 없습니다.</div>;

  const allSections: PersonalSection[] = ["hero", "about", "skills", "projects", "contact"];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 h-14 flex items-center justify-between">
        <Link href="/private" className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></Link>
        <p className="font-bold text-sm text-gray-900">개인 페이지 편집</p>
        <div className="flex items-center gap-2">
          <a href={`/p/${id}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg" title="미리보기"><Eye size={18} className="text-gray-600" /></a>
          <button onClick={save} disabled={saving}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold", saving ? "bg-gray-100 text-gray-400" : saved ? "bg-green-500 text-white" : "bg-violet-500 text-white hover:bg-violet-600")}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saved ? "저장됨" : "저장"}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {/* 테마 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">테마</p>
          <div className="grid grid-cols-3 gap-2">
            {VIBES.map((v) => (
              <button key={v.id} onClick={() => setThemeId(v.id as ThemeId)}
                className={cn("p-2 rounded-xl border-2 flex items-center gap-2", themeId === v.id ? "border-violet-400 bg-violet-50" : "border-gray-200")}>
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: v.primaryColor }} />
                <span className="text-xs font-medium truncate">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 섹션 on/off */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">표시 섹션</p>
          <div className="flex flex-wrap gap-2">
            {allSections.map((s) => (
              <button key={s} onClick={() => toggleSection(s)} disabled={s === "hero"}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold",
                  sections.includes(s) ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-400",
                  s === "hero" && "opacity-60")}>
                {SECTION_LABEL[s]}{s === "hero" && " (필수)"}
              </button>
            ))}
          </div>
        </div>

        {/* 기본 정보 */}
        {([["name", "이름"], ["tagline", "한 줄 소개"], ["role", "직함/역할"]] as const).map(([k, label]) => (
          <div key={k}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <input value={form[k]} onChange={(e) => up(k, e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">자기소개</label>
          <textarea value={form.bio} onChange={(e) => up("bio", e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">About (상세)</label>
          <textarea value={form.about} onChange={(e) => up("about", e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">스킬 (쉼표 구분)</label>
          <input value={form.skills} onChange={(e) => up("skills", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none" />
        </div>

        {/* 프로젝트 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">프로젝트</label>
            <button onClick={() => setProjects((p) => [...p, { id: crypto.randomUUID(), title: "", description: "", tags: "", link: "" }])}
              className="text-xs text-violet-500 font-semibold flex items-center gap-1"><Plus size={12} />추가</button>
          </div>
          <div className="space-y-3">
            {projects.map((proj, i) => (
              <div key={proj.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={proj.title} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                    placeholder="프로젝트 이름" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                  <button onClick={() => setProjects((p) => p.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                </div>
                <input value={proj.description} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                  placeholder="설명" className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                <div className="flex gap-2">
                  <input value={proj.tags} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, tags: e.target.value } : x))}
                    placeholder="태그" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                  <input value={proj.link} onChange={(e) => setProjects((p) => p.map((x, j) => j === i ? { ...x, link: e.target.value } : x))}
                    placeholder="링크" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 연락/소셜 */}
        <div className="grid grid-cols-2 gap-3">
          {([["email", "이메일"], ["phone", "전화번호"], ["github", "GitHub URL"], ["instagram", "Instagram URL"], ["linkedin", "LinkedIn URL"]] as const).map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input value={form[k]} onChange={(e) => up(k, e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
            </div>
          ))}
        </div>

        <a href={`/p/${id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          <ExternalLink size={15} />내 페이지 보기
        </a>
      </main>
    </div>
  );
}
