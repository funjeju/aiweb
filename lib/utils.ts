import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSiteId(name: string): string {
  // siteId는 URL 경로·Firestore 문서ID·서브도메인으로 쓰이므로 영숫자만 허용.
  // 한글 등은 제거하고, 남는 게 없으면 "site"를 기본 prefix로 사용.
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `site-${suffix}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3,4})(\d{3,4})(\d{4})/, "$1-$2-$3");
}

/**
 * 앱의 기준 URL을 반환한다.
 * 1순위: 브라우저에서 실행 중이면 현재 origin (배포 도메인 그대로)
 * 2순위: NEXT_PUBLIC_APP_URL 환경변수
 * 3순위: Vercel 자동 주입 도메인
 * 4순위: localhost (로컬 개발)
 */
export function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
