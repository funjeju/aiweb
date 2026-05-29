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
  async rewrites() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<subdomain>[^.]+)\\.(?!www)[^.]+\\.[^.]+" }],
        destination: "/site/:path*",
      },
    ];
  },
};

export default nextConfig;
