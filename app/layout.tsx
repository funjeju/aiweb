import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { GlobalBgmPlayer } from "@/components/GlobalBgmPlayer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://aiweb-xi-one.vercel.app"),
  title: {
    default: "별자리 우주 — 당신만의 별자리 다이어리",
    template: "%s | 별자리 우주",
  },
  description: "온 우주에 유일한 당신만의 별자리에서 당신의 기억을 담아가세요.",
  keywords: ["별자리", "다이어리", "우주", "나만의 공간", "감성"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "별자리 우주",
    title: "별자리 우주 — 당신만의 별자리 다이어리",
    description: "온 우주에 유일한 당신만의 별자리에서 당신의 기억을 담아가세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366F1",
  viewportFit: "cover",
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
      <body className="antialiased">
          <AuthProvider>
          <GlobalBgmPlayer />
          {children}
        </AuthProvider>
        </body>
    </html>
  );
}
