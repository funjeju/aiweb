"use client";

import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n/useLang";

const LANGS: { id: Lang; label: string }[] = [
  { id: "ko", label: "KOR" },
  { id: "en", label: "ENG" },
  { id: "zh", label: "中文" },
];

interface LangToggleProps {
  lang: Lang;
  loading: boolean;
  onSwitch: (lang: Lang) => void;
  /** "light" = 흰 배경 (PersonalSite), "dark" = 어두운 배경 (UniverseHome) */
  theme?: "light" | "dark";
}

export function LangToggle({ lang, loading, onSwitch, theme = "light" }: LangToggleProps) {
  const isLight = theme === "light";
  return (
    <div className={cn(
      "flex items-center gap-0.5 rounded-full border p-1 shadow-sm",
      isLight
        ? "bg-white/90 backdrop-blur border-gray-200"
        : "bg-black/40 backdrop-blur border-white/15"
    )}>
      {loading && <Loader2 size={12} className={cn("animate-spin ml-1", isLight ? "text-indigo-400" : "text-violet-400")} />}
      <Globe size={12} className={cn("ml-1", isLight ? "text-gray-400" : "text-white/40")} />
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => onSwitch(l.id)}
          disabled={loading}
          className={cn(
            "text-[11px] font-bold px-2 py-1 rounded-full transition-colors",
            lang === l.id
              ? isLight ? "bg-gray-900 text-white" : "bg-white/20 text-white"
              : isLight ? "text-gray-500 hover:bg-gray-100" : "text-white/40 hover:text-white/70"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
