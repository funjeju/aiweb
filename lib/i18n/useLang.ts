"use client";

import { useState, useEffect, useCallback } from "react";

export type Lang = "ko" | "en";
const STORAGE_KEY = "aiweb_lang";
const VALID: Lang[] = ["ko", "en"];

export function useLang() {
  const [lang, setLangState] = useState<Lang>("ko");

  // 마운트 시 localStorage에서 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && VALID.includes(saved)) setLangState(saved);
    } catch { /* SSR 등 환경에서 무시 */ }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* 무시 */ }
  }, []);

  return { lang, setLang };
}

/** Gemini 번역 API 호출 (기존 /api/translate 재사용) */
export async function fetchTranslations(texts: string[], lang: Lang): Promise<string[]> {
  if (lang === "ko") return texts;
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, lang }),
  });
  const data = await res.json();
  return Array.isArray(data.translations) ? data.translations : texts;
}
