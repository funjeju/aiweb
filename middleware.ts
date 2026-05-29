import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/create", "/editor"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Firebase Auth는 클라이언트 사이드 — 세션 쿠키로 간단히 체크
  const session = req.cookies.get("__session")?.value;
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/create/:path*", "/editor/:path*"],
};
