"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n/useLang";

const LANGS: { id: Lang; label: string }[] = [
  { id: "ko", label: "KOR" },
  { id: "en", label: "ENG" },
];

interface LangToggleProps {
  lang: Lang;
  loading: boolean;
  onSwitch: (lang: Lang) => void;
  theme?: "light" | "dark";
}

export function LangToggle({ lang, loading, onSwitch, theme = "light" }: LangToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isLight = theme === "light";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (l: Lang) => {
    onSwitch(l);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
          isLight
            ? "bg-white/90 backdrop-blur border-gray-200 text-gray-500 hover:bg-gray-100"
            : "bg-black/40 backdrop-blur border-white/15 text-white/50 hover:bg-white/10 hover:text-white"
        )}
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <Globe size={14} />}
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 top-10 z-50 flex flex-col rounded-xl border shadow-lg overflow-hidden",
          isLight
            ? "bg-white border-gray-200"
            : "bg-[#0b1026] border-white/15"
        )}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => select(l.id)}
              className={cn(
                "px-4 py-2 text-xs font-bold text-left transition-colors",
                lang === l.id
                  ? isLight ? "bg-gray-900 text-white" : "bg-white/20 text-white"
                  : isLight ? "text-gray-600 hover:bg-gray-100" : "text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
