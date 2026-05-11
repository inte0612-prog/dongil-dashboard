/**
 * auth.ts — 인증 관련 상수 모음
 *
 * 이 파일이 "교체 포인트"입니다.
 * 추후 Supabase Auth로 전환할 때는 이 파일 대신
 * Supabase 로그인 함수를 app/actions/auth.ts에서 호출하면 됩니다.
 */

// 관리자 계정 정보 (하드코딩 방식)
export const ADMIN_CREDENTIALS = {
  id: "admin",
  pw: "admin1234",
} as const;

// 로그인 상태를 저장하는 쿠키 설정
export const AUTH_COOKIE = {
  name: "admin_auth",   // 쿠키 이름
  value: "authenticated", // 로그인 성공 시 저장할 값
} as const;
