/**
 * middleware.ts — 라우트 보호 미들웨어
 *
 * Next.js 미들웨어는 요청이 페이지에 도달하기 전에 실행됩니다.
 * 모든 페이지 요청을 가로채서 로그인 여부를 확인합니다.
 *
 * 동작 방식:
 *   - 비로그인 상태로 보호된 페이지 접근 → /login 으로 리다이렉트
 *   - 이미 로그인된 상태로 /login 접근 → / 으로 리다이렉트
 *   - 로그인된 상태로 일반 페이지 접근 → 정상 통과
 */

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export function middleware(request: NextRequest) {
  // 쿠키에서 인증 값 읽기
  const authCookie = request.cookies.get(AUTH_COOKIE.name);
  const isAuthenticated = authCookie?.value === AUTH_COOKIE.value;

  const { pathname } = request.nextUrl;

  // ── 로그인 페이지 처리 ──
  if (pathname === "/login") {
    if (isAuthenticated) {
      // 이미 로그인된 사용자가 /login 접근 → 홈으로 이동
      return NextResponse.redirect(new URL("/", request.url));
    }
    // 비로그인 상태로 /login 접근 → 정상 통과
    return NextResponse.next();
  }

  // ── 보호된 페이지 처리 ──
  if (!isAuthenticated) {
    // 비로그인 상태 → /login 으로 리다이렉트
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 로그인 상태 → 정상 통과
  return NextResponse.next();
}

// 미들웨어를 적용할 경로 패턴 설정
export const config = {
  matcher: [
    // 아래 경로는 미들웨어에서 제외 (처리할 필요 없음)
    //   api       : API 라우트 (서버 내부 통신)
    //   _next     : Next.js 내부 파일 (JS, CSS, 이미지 등)
    //   favicon   : 파비콘
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
