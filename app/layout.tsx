import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI 웹빌더 - 소상공인 홈페이지 3분 완성",
    template: "%s | AI 웹빌더",
  },
  description: "네이버 플레이스 URL 하나로 3분 안에 가게 홈페이지를 만드세요. 소상공인을 위한 AI 웹빌더.",
  keywords: ["소상공인 홈페이지", "가게 홈페이지", "AI 웹빌더", "네이버 플레이스"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "AI 웹빌더",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
