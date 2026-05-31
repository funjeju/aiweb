"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { createPersonal } from "@/lib/firebase/personals";
import { PERSONA_TYPES } from "@/lib/types/personal";
import type { PersonalSchema } from "@/lib/types/personal";
import { generatePersonalId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { ConstellationPreview } from "@/components/universe/ConstellationPreview";

const COLOR_PRESETS = ["#a78bfa", "#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#c084fc"];

export default function PrivateCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#a78bfa");
  const [favoriteNumber, setFavoriteNumber] = useState("7");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!name.trim()) { setError("이름을 입력해주세요"); return; }
    setError("");
    setCreating(true);
    try {
      const id = generatePersonalId(name);
      // 유형은 내부적으로 portfolio 고정 (유형 선택 UI는 숨김)
      const def = PERSONA_TYPES.find((t) => t.id === "portfolio")!;
      const now = new Date().toISOString();
      const data: PersonalSchema = {
        id, ownerId: user?.uid ?? "anonymous", slug: id, published: true,
        createdAt: now, updatedAt: now,
        personaType: "portfolio", themeId: "warm-ocean",
        profile: { name, tagline: "", role: "", bio: "", socials: {} },
        about: "",
        skills: [],
        projects: [],
        contact: { message: "궁금한 점이 있으면 편하게 연락주세요." },
        sections: def.sections,
        universe: {
          color,
          favoriteNumber: Number(favoriteNumber) || 7,
          menus: [
            { id: "profile", label: "내 소개", icon: "profile" },
            { id: "diary", label: "다이어리", icon: "diary" },
            { id: "gallery", label: "갤러리", icon: "gallery" },
          ],
        },
      };
      await createPersonal(data);
      router.push(`/p/${id}`);
    } catch (err) {
      console.error("personal create failed:", err);
      setError("생성에 실패했습니다. 다시 시도해주세요.");
      setCreating(false);
    }
  };

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
        <p className="text-white/50 text-sm mb-6">이름·색·숫자로 세상에 하나뿐인 별자리가 만들어져요</p>

        {/* 실시간 별자리 미리보기 */}
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-6 aspect-[4/3]">
          <ConstellationPreview name={name} color={color} favoriteNumber={Number(favoriteNumber) || 7} />
        </div>

        <div className="space-y-5">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-semibold mb-2">이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 김제주"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-violet-400 focus:outline-none text-white placeholder-white/30" />
          </div>

          {/* 색 */}
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

          {/* 숫자 */}
          <div>
            <label className="block text-sm font-semibold mb-2">좋아하는 숫자</label>
            <input type="number" value={favoriteNumber} onChange={(e) => setFavoriteNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-violet-400 focus:outline-none text-white" />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button onClick={create} disabled={!name.trim()}
            className={cn("w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white",
              name.trim() ? "hover:opacity-90" : "opacity-40 cursor-not-allowed")}
            style={{ backgroundColor: color }}>
            <Sparkles size={18} />내 별자리 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
