import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  const ip = getIp(req);

  // 로컬 개발 환경 fallback
  if (ip === "unknown" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.")) {
    return NextResponse.json({ country: "KR", ip });
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "aiweb-universe/1.0" },
      next: { revalidate: 86400 }, // 24h 캐시
    });
    const data = await res.json();
    const country = (data.country_code as string) ?? "KR";
    return NextResponse.json({ country, ip });
  } catch {
    return NextResponse.json({ country: "KR", ip });
  }
}
