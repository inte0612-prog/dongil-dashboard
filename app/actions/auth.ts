"use server";

/**
 * auth.ts — 로그인 / 로그아웃 Server Action
 *
 * "use server" 덕분에 이 함수들은 서버에서만 실행됩니다.
 * 클라이언트 코드에 비밀번호가 노출되지 않습니다.
 *
 * 추후 Supabase Auth로 교체 시:
 *   - loginAction 내부의 자격증명 비교 로직을 supabase.auth.signInWithPassword()로 교체
 *   - logoutAction 내부를 supabase.auth.signOut()으로 교체
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_CREDENTIALS, AUTH_COOKIE } from "@/lib/auth";

// useActionState 훅이 기대하는 상태 타입
export type LoginState = { error: string } | null;

/**
 * loginAction — 로그인 폼 제출 시 실행되는 서버 액션
 * @param _prevState 이전 상태 (useActionState 필수 파라미터)
 * @param formData 폼 데이터 (id, pw 필드)
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const id = formData.get("id") as string;
  const pw = formData.get("pw") as string;

  // 자격증명 검증
  if (id !== ADMIN_CREDENTIALS.id || pw !== ADMIN_CREDENTIALS.pw) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  // 로그인 성공 → httpOnly 쿠키 저장 (JS에서 접근 불가 → XSS 방어)
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE.name, AUTH_COOKIE.value, {
    httpOnly: true,                                        // JS 접근 차단
    secure: process.env.NODE_ENV === "production",        // HTTPS에서만 전송
    sameSite: "lax",                                      // CSRF 방어
    // maxAge 미설정 → 세션 쿠키 (브라우저 종료 시 자동 삭제)
    path: "/",
  });

  // 대시보드로 이동 (login=1 → SessionGuard가 sessionStorage 플래그 세팅)
  redirect("/dashboard?login=1");
}

/**
 * logoutAction — 로그아웃 버튼 클릭 시 실행되는 서버 액션
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE.name);

  // 로그인 페이지로 이동
  redirect("/login");
}
