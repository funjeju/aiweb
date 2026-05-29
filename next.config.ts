import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        // Firebase Google 로그인 팝업이 부모 창과 통신할 수 있도록 허용
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  // 서브도메인 멀티테넌시 rewrite는 커스텀 도메인 연결 후 재도입 예정.
  // vercel.app 기본 도메인을 서브도메인으로 오인해 전 경로를 /site/로 보내는 문제로 비활성화.
};

export default nextConfig;
