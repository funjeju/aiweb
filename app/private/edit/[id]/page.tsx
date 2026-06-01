"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPersonalById, updatePersonal } from "@/lib/firebase/personals";
import { uploadPersonalImage, deletePersonalImage } from "@/lib/firebase/storage";
import { getAllAssets } from "@/lib/firebase/assets";
import { SECTION_LABEL } from "@/lib/types/personal";
import type { UniverseAsset } from "@/lib/types/asset";
import { DEFAULT_ASSETS } from "@/lib/types/asset";
import type {
  PersonalSchema, PersonalSection, PersonalProject,
  SkyTheme, LineStyle, StarGlow, UniverseIconType,
} from "@/lib/types/personal";
import {
  validateSlugFormat, normalizeSlug,
  checkSlugAvailable, updateSlug,
} from "@/lib/slug-registry";
import { VIBES } from "@/lib/types/site";
import type { ThemeId } from "@/lib/types/site";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, ExternalLink, Eye,
  User, BookOpen, Image as ImageIcon, Link2, Music, FileText,
  Camera, Upload, X, Copy, Check, Globe,
} from "lucide-react";

const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "study.funjeju.co";
type SlugState = "idle" | "checking" | "ok" | "taken" | "error" | "saving";

type ProjForm = { id: string; title: string; description: string; tags: string; link: string };

const SKY_THEMES: { id: SkyTheme; label: string; colors: [string, string] }[] = [
  { id: "deep-space",    label: "딥 스페이스",  colors: ["#0d1330", "#04050d"] },
  { id: "purple-galaxy", label: "퍼플 갤럭시",  colors: ["#120820", "#060208"] },
  { id: "jeju",          label: "제주 감성",    colors: ["#071820", "#02090e"] },
  { id: "vintage",       label: "빈티지 천문도", colors: ["#1a1208", "#080501"] },
];

const LINE_STYLES: { id: LineStyle; label: string; desc: string }[] = [
  { id: "flow",   label: "빛 흐름", desc: "그라데이션 펄스 (기본)" },
  { id: "dotted", label: "점선",   desc: "클래식 점선 스타일" },
  { id: "aurora", label: "오로라", desc: "넓은 빛 번짐 효과" },
];

const STAR_GLOWS: { id: StarGlow; label: string }[] = [
  { id: "soft",    label: "은은" },
  { id: "default", label: "보통" },
  { id: "intense", label: "강렬" },
];

const MENU_CATALOG: { icon: UniverseIconType; label: string; Icon: React.ReactNode }[] = [
  { icon: "profile", label: "내 소개",  Icon: <User size={14} /> },
  { icon: "diary",   label: "다이어리", Icon: <BookOpen size={14} /> },
  { icon: "gallery", label: "갤러리",   Icon: <ImageIcon size={14} /> },
  { icon: "link",    label: "링크 모음", Icon: <Link2 size={14} /> },
  { icon: "music",   label: "음악",     Icon: <Music size={14} /> },
  { icon: "note",    label: "메모",     Icon: <FileText size={14} /> },
];

type UniverseMenuForm = { id: string; label: string; icon: UniverseIconType; customIcon?: string };

// 메뉴 아이콘으로 자주 쓰는 이모지 빠른 선택
const MENU_EMOJI_PRESETS = ["⭐", "🌙", "🪐", "🚀", "💫", "🌷", "📷", "🎵", "✍️", "💌", "🔮", "🌈"];

export default function PrivateEditPage() {
  const { id } = useParams<{ id: string }>();
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

  // 별자리 스타일
  const [skyTheme, setSkyTheme] = useState<SkyTheme>("deep-space");
  const [lineStyle, setLineStyle] = useState<LineStyle>("flow");
  const [starGlow, setStarGlow] = useState<StarGlow>("default");
  const [universeMenus, setUniverseMenus] = useState<UniverseMenuForm[]>([]);
  const [isUniverse, setIsUniverse] = useState(false);

  // 프로필 사진
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 갤러리
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 에셋
  const [allAssets, setAllAssets] = useState<UniverseAsset[]>(DEFAULT_ASSETS);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // 슬러그/공개 주소
  const [publicSlug, setPublicSlug] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [slugError, setSlugError] = useState("");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [editingSlug, setEditingSlug] = useState(false);
  const [copied, setCopied] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setPhoto(p.profile.photo);
      setPublicSlug(p.publicSlug ?? "");
      setPublicUrl(p.publicUrl ?? "");
      // 에셋 로드
      getAllAssets().then(setAllAssets).catch(() => {});
      if (p.universe) {
        setSelectedAssets(p.universe.selectedAssets ?? []);
        setIsUniverse(true);
        setSkyTheme(p.universe.style?.skyTheme ?? "deep-space");
        setLineStyle(p.universe.style?.lineStyle ?? "flow");
        setStarGlow(p.universe.style?.starGlow ?? "default");
        setUniverseMenus(p.universe.menus ?? []);
        setGalleryImages(p.universe.galleryImages ?? []);
      }
      setLoading(false);
    });
  }, [id]);

  const up = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  /* 슬러그 중복 체크 */
  const handleSlugChange = (raw: string) => {
    const normalized = normalizeSlug(raw);
    setSlugInput(normalized);
    setSlugSuggestions([]);
    const formatErr = normalized ? validateSlugFormat(normalized) : null;
    if (formatErr) { setSlugState("error"); setSlugError(formatErr); return; }
    if (!normalized) { setSlugState("idle"); setSlugError(""); return; }
    setSlugState("checking"); setSlugError("");
    if (checkTimer.current) clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(async () => {
      const result = await checkSlugAvailable(normalized);
      if (result.available) {
        setSlugState("ok");
      } else {
        setSlugState("taken");
        setSlugError("이미 사용 중인 주소예요");
        setSlugSuggestions(result.suggestions ?? []);
      }
    }, 500);
  };

  /* 슬러그 변경 저장 */
  const applySlug = async () => {
    if (!base || !slugInput || slugState !== "ok") return;
    setSlugState("saving");
    try {
      const targetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/p/${id}`;
      const result = await updateSlug({
        old_slug: publicSlug,
        new_slug: slugInput,
        target_url: targetUrl,
        owner_id: base.ownerId,
      });
      if (result.success) {
        setPublicSlug(result.final_slug);
        setPublicUrl(result.short_url);
        await updatePersonal(id, { publicSlug: result.final_slug, publicUrl: result.short_url });
        setEditingSlug(false);
        setSlugInput("");
        setSlugState("idle");
      } else {
        setSlugError(result.error ?? "변경에 실패했습니다");
        setSlugState("error");
      }
    } catch {
      setSlugError("오류가 발생했습니다");
      setSlugState("error");
    }
  };

  const copyUrl = () => {
    const url = publicUrl ? `https://${publicUrl}` : "";
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* 프로필 사진 업로드 */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const url = await uploadPersonalImage(id, "photo", file);
      setPhoto(url);
    } catch {
      alert("사진 업로드에 실패했습니다.");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  /* 갤러리 이미지 업로드 (다중 선택 가능) */
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadPersonalImage(id, "gallery", f)));
      setGalleryImages((prev) => [...prev, ...urls]);
    } catch {
      alert("갤러리 업로드에 실패했습니다.");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };

  /* 갤러리 이미지 삭제 */
  const removeGalleryImage = async (url: string) => {
    setGalleryImages((prev) => prev.filter((u) => u !== url));
    await deletePersonalImage(url).catch(() => {});
  };

  const addMenu = (icon: UniverseIconType, label: string) => {
    if (universeMenus.length >= 6) return;
    if (universeMenus.some((m) => m.icon === icon)) return;
    setUniverseMenus((prev) => [...prev, { id: icon, label, icon }]);
  };

  const removeMenu = (icon: UniverseIconType) => {
    setUniverseMenus((prev) => prev.filter((m) => m.icon !== icon));
  };

  const setMenuIcon = (icon: UniverseIconType, customIcon: string | undefined) => {
    setUniverseMenus((prev) => prev.map((m) => {
      if (m.icon !== icon) return m;
      if (!customIcon) {
        // 기본 아이콘으로 — customIcon 키 제거 (Firestore undefined 방지)
        const { customIcon: _drop, ...rest } = m;
        void _drop;
        return rest;
      }
      return { ...m, customIcon };
    }));
  };

  const save = async () => {
    if (!base) return;
    setSaving(true);
    setSaved(false);
    try {
      const cleanProjects: PersonalProject[] = projects.filter((p) => p.title.trim()).map((p) => ({
        id: p.id, title: p.title, description: p.description, tags: p.tags, link: p.link || undefined,
      }));

      const universeUpdate = isUniverse && base.universe ? {
        universe: {
          ...base.universe,
          menus: universeMenus,
          style: { skyTheme, lineStyle, starGlow },
          galleryImages,
          selectedAssets,
        },
      } : {};

      await updatePersonal(id, {
        themeId,
        sections,
        publicSlug: publicSlug || undefined,
        publicUrl: publicUrl || undefined,
        profile: {
          ...base.profile,
          name: form.name, tagline: form.tagline, role: form.role, bio: form.bio,
          photo: photo || undefined,
          socials: {
            github: form.github || undefined, instagram: form.instagram || undefined,
            linkedin: form.linkedin || undefined, email: form.email || undefined,
          },
        },
        about: form.about,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        projects: cleanProjects,
        contact: { email: form.email || undefined, phone: form.phone || undefined, message: base.contact?.message || "" },
        ...universeUpdate,
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
    if (s === "hero") return;
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
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold",
              saving ? "bg-gray-100 text-gray-400" : saved ? "bg-green-500 text-white" : "bg-violet-500 text-white hover:bg-violet-600")}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saved ? "저장됨" : "저장"}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-5">

        {/* ── 내 공개 주소 ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-violet-500" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">내 공개 주소</p>
          </div>

          {publicUrl ? (
            <>
              {/* 현재 주소 표시 */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-200">
                <span className="flex-1 text-sm font-mono text-violet-700 truncate">
                  {publicUrl}
                </span>
                <button onClick={copyUrl}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-violet-100 transition-colors text-violet-500">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>

              {/* 슬러그 변경 */}
              {!editingSlug ? (
                <button onClick={() => { setEditingSlug(true); setSlugInput(publicSlug); handleSlugChange(publicSlug); }}
                  className="text-xs text-gray-400 hover:text-violet-500 transition-colors">
                  주소 변경하기
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-gray-200 focus-within:border-violet-400 transition-colors">
                    <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap shrink-0">
                      {PUBLIC_DOMAIN}/
                    </span>
                    <input
                      value={slugInput}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      autoFocus
                    />
                    <span className="px-2 shrink-0">
                      {slugState === "checking" && <Loader2 size={13} className="animate-spin text-gray-400" />}
                      {slugState === "ok" && <Check size={13} className="text-green-500" />}
                      {slugState === "taken" && <X size={13} className="text-red-400" />}
                    </span>
                  </div>
                  {slugError && <p className="text-xs text-red-400">{slugError}</p>}
                  {slugSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-gray-400">추천:</span>
                      {slugSuggestions.map((s) => (
                        <button key={s} onClick={() => handleSlugChange(s)}
                          className="text-xs px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={applySlug}
                      disabled={slugState !== "ok"}
                      className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-colors",
                        slugState === "ok"
                          ? "bg-violet-500 text-white hover:bg-violet-600"
                          : slugState === "saving"
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
                      {slugState === "saving" ? "변경 중..." : "변경 확정"}
                    </button>
                    <button onClick={() => { setEditingSlug(false); setSlugInput(""); setSlugState("idle"); setSlugError(""); }}
                      className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-100">
                      취소
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">아직 주소가 발급되지 않았어요.<br />저장 또는 새로 생성하면 자동으로 발급됩니다.</p>
          )}
        </div>

        {/* ── 별자리 꾸미기 섹션 ── */}
        {isUniverse && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 space-y-5">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">✦ 별자리 꾸미기</p>

            {/* 하늘 테마 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">하늘 테마</p>
              <div className="grid grid-cols-2 gap-2">
                {SKY_THEMES.map((t) => (
                  <button key={t.id} onClick={() => setSkyTheme(t.id)}
                    className={cn("p-2.5 rounded-xl border-2 flex items-center gap-2.5 text-left",
                      skyTheme === t.id ? "border-violet-400 bg-white" : "border-gray-200 bg-white/60")}>
                    <span className="w-8 h-8 rounded-lg shrink-0 overflow-hidden relative">
                      <span className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} />
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 연결선 스타일 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">연결선 스타일</p>
              <div className="flex gap-2">
                {LINE_STYLES.map((l) => (
                  <button key={l.id} onClick={() => setLineStyle(l.id)}
                    className={cn("flex-1 py-2 px-1 rounded-xl border-2 text-center",
                      lineStyle === l.id ? "border-violet-400 bg-white" : "border-gray-200 bg-white/60")}>
                    <p className="text-xs font-bold text-gray-700">{l.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 별 반짝임 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">별 반짝임</p>
              <div className="flex gap-2">
                {STAR_GLOWS.map((g) => (
                  <button key={g.id} onClick={() => setStarGlow(g.id)}
                    className={cn("flex-1 py-2 rounded-xl border-2 text-xs font-bold",
                      starGlow === g.id ? "border-violet-400 bg-white text-violet-600" : "border-gray-200 bg-white/60 text-gray-500")}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 우주 에셋 선택 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                우주 에셋 <span className="text-gray-400 font-normal">({selectedAssets.length}개 활성)</span>
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {allAssets.filter((a) => a.isFree).map((asset) => {
                  const active = selectedAssets.includes(asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAssets((prev) =>
                        active ? prev.filter((id) => id !== asset.id) : [...prev, asset.id]
                      )}
                      title={asset.name}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all",
                        active ? "border-violet-400 bg-violet-50 scale-105" : "border-gray-200 bg-white/60 hover:border-violet-200"
                      )}
                    >
                      <span className="text-xl leading-none">{asset.emoji}</span>
                      <span className="text-[9px] text-gray-500 font-medium">{asset.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">클릭해서 우주에 띄울 에셋 선택</p>
            </div>

            {/* 메뉴 모듈 관리 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">메뉴 구성 <span className="text-gray-400 font-normal">({universeMenus.length}/6)</span></p>
              <div className="space-y-2 mb-2">
                {universeMenus.map((m) => (
                  <div key={m.icon} className="bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        {/* 현재 아이콘 미리보기 (동그라미 안) */}
                        <span className="w-7 h-7 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-500 text-sm">
                          {m.customIcon ? <span className="text-base leading-none">{m.customIcon}</span> : MENU_CATALOG.find((c) => c.icon === m.icon)?.Icon}
                        </span>
                        {m.label}
                      </div>
                      {universeMenus.length > 1 && (
                        <button onClick={() => removeMenu(m.icon)} className="text-gray-300 hover:text-red-400 p-1">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    {/* 아이콘 커스터마이징 */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-gray-400 mr-0.5">아이콘</span>
                      {/* 기본(lucide) */}
                      <button onClick={() => setMenuIcon(m.icon, undefined)}
                        className={cn("w-6 h-6 rounded-full flex items-center justify-center border text-[10px] transition-colors",
                          !m.customIcon ? "border-violet-400 bg-violet-50 text-violet-600" : "border-gray-200 text-gray-400 hover:border-violet-300")}
                        title="기본 아이콘">기본</button>
                      {MENU_EMOJI_PRESETS.map((emo) => (
                        <button key={emo} onClick={() => setMenuIcon(m.icon, emo)}
                          className={cn("w-6 h-6 rounded-full flex items-center justify-center border text-sm transition-transform hover:scale-110",
                            m.customIcon === emo ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300" : "border-gray-200")}>
                          {emo}
                        </button>
                      ))}
                      {/* 직접 입력 */}
                      <input value={m.customIcon ?? ""} onChange={(e) => setMenuIcon(m.icon, e.target.value.slice(0, 2) || undefined)}
                        placeholder="✏️" maxLength={2}
                        className="w-8 h-6 text-center rounded-full border border-gray-200 text-sm focus:border-violet-400 focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
              {universeMenus.length < 6 && (
                <div className="flex flex-wrap gap-1.5">
                  {MENU_CATALOG.filter((c) => !universeMenus.some((m) => m.icon === c.icon)).map((c) => (
                    <button key={c.icon} onClick={() => addMenu(c.icon, c.label)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-dashed border-gray-300 text-xs text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors">
                      <Plus size={10} />{c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 내 소개 — 프로필 사진 ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">내 소개</p>

          {/* 프로필 사진 */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
              {photo
                ? <Image src={photo} alt="프로필 사진" width={80} height={80} className="w-full h-full object-cover" />
                : <User size={28} className="text-gray-300" />
              }
              {photoUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-colors">
                <Camera size={13} />{photo ? "사진 변경" : "사진 추가"}
              </button>
              {photo && (
                <button onClick={() => setPhoto(undefined)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
                  <X size={11} />삭제
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
          </div>

          {/* 기본 정보 */}
          {([["name", "이름"], ["tagline", "한 줄 소개"], ["role", "직함/역할"]] as const).map(([k, label]) => (
            <div key={k}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
              <input value={form[k]} onChange={(e) => up(k, e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">자기소개</label>
            <textarea value={form.bio} onChange={(e) => up("bio", e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none resize-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">About (상세 소개)</label>
            <textarea value={form.about} onChange={(e) => up("about", e.target.value)} rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none resize-none text-sm" />
          </div>
        </div>

        {/* ── 소셜 링크 ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">소셜 링크</p>
          <div className="grid grid-cols-1 gap-2.5">
            {([
              ["github", "GitHub URL"],
              ["instagram", "Instagram URL"],
              ["linkedin", "LinkedIn URL"],
              ["email", "이메일"],
              ["phone", "전화번호"],
            ] as const).map(([k, label]) => (
              <div key={k} className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 w-24 shrink-0">{label}</label>
                <input value={form[k]} onChange={(e) => up(k, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-violet-400 focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        {/* ── 갤러리 이미지 ── */}
        {isUniverse && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                갤러리 <span className="text-gray-400 font-normal">({galleryImages.length}장)</span>
              </p>
              <button onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-colors">
                {galleryUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {galleryUploading ? "업로드 중..." : "사진 추가"}
              </button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
            </div>

            {galleryImages.length === 0 ? (
              <button onClick={() => galleryInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-violet-300 hover:text-violet-400 transition-colors">
                <ImageIcon size={24} />
                <span className="text-xs font-medium">사진을 추가해보세요</span>
                <span className="text-[11px] text-gray-300">여러 장 동시 선택 가능</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((url) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                    <Image src={url} alt="" width={120} height={120} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryImage(url)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {/* 추가 버튼 */}
                <button onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-violet-300 hover:text-violet-400 transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 스킬 ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">스킬 (쉼표 구분)</label>
          <input value={form.skills} onChange={(e) => up("skills", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none" />
        </div>

        {/* ── 프로젝트 ── */}
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
                    placeholder="링크" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-violet-400 focus:invoke-none focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 비별자리 전용: 테마 / 섹션 ── */}
        {!isUniverse && (
          <>
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
          </>
        )}

        <a href={`/p/${id}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          <ExternalLink size={15} />내 페이지 보기
        </a>
      </main>
    </div>
  );
}
