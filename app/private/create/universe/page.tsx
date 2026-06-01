"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { createPersonal } from "@/lib/firebase/personals";
import { PERSONA_TYPES } from "@/lib/types/personal";
import type { PersonalSchema } from "@/lib/types/personal";
import { generatePersonalId } from "@/lib/utils";
import {
  validateSlugFormat, normalizeSlug,
  checkSlugAvailable, registerSlug,
} from "@/lib/slug-registry";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, Loader2, Check, X, Link as LinkIcon } from "lucide-react";
import { ConstellationPreview } from "@/components/universe/ConstellationPreview";
import { generateConstellation } from "@/lib/universe/stars";

const COLOR_PRESETS = ["#a78bfa", "#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#c084fc"];
const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_SLUG_DOMAIN ?? "study.funjeju.com";

type SlugState = "idle" | "checking" | "ok" | "taken" | "error";

export default function UniverseCreatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#a78bfa");
  const [favoriteNumber, setFavoriteNumber] = useState("7");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [slugInput, setSlugInput] = useState("");
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [slugError, setSlugError] = useState("");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 로그인 필수
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?from=/private/create/universe");
  }, [user, authLoading, router]);

  const derivedSlug = slugInput || normalizeSlug(name) || "";

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
      if (result.available) setSlugState("ok");
      else {
        setSlugState("taken");
        setSlugError("이미 사용 중인 주소예요");
        setSlugSuggestions(result.suggestions ?? []);
      }
    }, 500);
  };

  const create = async () => {
    if (!user) { router.replace("/login?from=/private/create/universe"); return; }
    if (!name.trim()) { setError("이름(닉네임)을 입력해주세요"); return; }
    if (slugState === "taken") { setError("다른 주소를 선택해주세요"); return; }
    if (slugState === "checking") { setError("주소 확인 중입니다"); return; }
    setError(""); setCreating(true);

    try {
      const id = generatePersonalId(name);
      // window.location.origin: 항상 현재 배포 도메인 사용 (env 설정 불필요)
      const targetUrl = `${window.location.origin}/p/${id}`;
      const slugToRegister = derivedSlug || id;
      const regResult = await registerSlug({ slug: slugToRegister, target_url: targetUrl, owner_id: user.uid });

      const def = PERSONA_TYPES.find((t) => t.id === "portfolio")!;
      const now = new Date().toISOString();
      const data: PersonalSchema = {
        id, ownerId: user.uid, slug: id,
        publicSlug: regResult.final_slug,
        publicUrl: regResult.short_url,
        published: true,
        createdAt: now, updatedAt: now,
        personaType: "portfolio", themeId: "warm-ocean",
        profile: { name, tagline: "", role: "", bio: "", socials: {} },
        about: "", skills: [], projects: [],
        contact: { message: "" },
        sections: def.sections,
        universe: {
          color,
          favoriteNumber: Number(favoriteNumber) || 7,
          constellationSeed: generateConstellation(name, color, Number(favoriteNumber) || 7).seed,
          menus: [
            { id: "profile", label: "내 소개", icon: "profile" },
            { id: "diary",   label: "다이어리", icon: "diary" },
            { id: "gallery", label: "갤러리",   icon: "gallery" },
          ],
        },
      };
      await createPersonal(data);
      router.push(`/p/${id}`);
    } catch (err) {
      console.error(err);
      setError("생성에 실패했습니다. 다시 시도해주세요.");
      setCreating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060f]">
        <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (creating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 bg-[#05060f]">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
          <Sparkles className="w-10 h-10 animate-pulse" style={{ color }} />
        </div>
        <p className="font-bold text-lg text-white">별자리를 그리고 있어요</p>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060f] text-white">
      <div className="max-w-md mx-auto px-6 py-10">
        <button onClick={() => router.push("/private")} className="flex items-center gap-1.5 text-sm text-white/50 mb-8 hover:text-white/80">
          <ArrowLeft size={16} />돌아가기
        </button>

        <h1 className="text-2xl font-bold mb-1">나만의 별자리 만들기</h1>
        <p className="text-white/50 text-sm mb-6">이름·색·숫자로 세상에 하나뿐인 우주가 만들어져요</p>

        <div className="rounded-2xl overflow-hidden border border-white/10 mb-6 aspect-[4/3]">
          <ConstellationPreview name={name} color={color} favoriteNumber={Number(favoriteNumber) || 7} />
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">닉네임</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 밤하늘별이"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-violet-400 focus:outline-none text-white placeholder-white/30" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">좋아하는 색</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("w-8 h-8 rounded-full transition-transform", color === c ? "ring-2 ring-white scale-110" : "hover:scale-105")}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full border border-white/20 cursor-pointer bg-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">좋아하는 숫자</label>
            <input type="number" value={favoriteNumber} onChange={(e) => setFavoriteNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-violet-400 focus:outline-none text-white" />
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-semibold mb-1">내 주소 <span className="text-white/40 font-normal text-xs">(선택 — 비워두면 자동)</span></label>
            <div className="flex items-center rounded-xl overflow-hidden border border-white/15 mb-2 focus-within:border-violet-400 transition-colors">
              <span className="px-3 py-3 text-sm text-white/40 bg-white/5 border-r border-white/10 whitespace-nowrap shrink-0">
                {PUBLIC_DOMAIN}/
              </span>
              <input value={slugInput} onChange={(e) => handleSlugChange(e.target.value)}
                placeholder={normalizeSlug(name) || "my-universe"}
                className="flex-1 px-3 py-3 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none" />
              <span className="px-3 shrink-0">
                {slugState === "checking" && <Loader2 size={15} className="animate-spin text-white/40" />}
                {slugState === "ok" && <Check size={15} className="text-green-400" />}
                {slugState === "taken" && <X size={15} className="text-red-400" />}
              </span>
            </div>
            {slugState === "ok" && <p className="text-xs text-green-400 flex items-center gap-1"><Check size={11} />사용 가능해요</p>}
            {(slugState === "taken" || slugState === "error") && <p className="text-xs text-red-400">{slugError}</p>}
            {slugSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-white/40">추천:</span>
                {slugSuggestions.map((s) => (
                  <button key={s} onClick={() => handleSlugChange(s)}
                    className="text-xs px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {derivedSlug && slugState !== "error" && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/30">
                <LinkIcon size={10} /><span className="font-mono">{PUBLIC_DOMAIN}/{derivedSlug}</span>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button onClick={create}
            disabled={!name.trim() || slugState === "taken" || slugState === "checking"}
            className={cn("w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-opacity",
              name.trim() && slugState !== "taken" && slugState !== "checking" ? "hover:opacity-90" : "opacity-40 cursor-not-allowed")}
            style={{ backgroundColor: color }}>
            <Sparkles size={18} />내 별자리 우주 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
