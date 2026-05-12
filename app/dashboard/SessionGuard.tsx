"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const SESSION_KEY = "dashboard_session_active";

export function SessionGuard() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isLoginRedirect = searchParams.get("login") === "1";

    if (isLoginRedirect) {
      // 로그인 직후 진입 → 세션 플래그 저장 + URL 정리
      sessionStorage.setItem(SESSION_KEY, "1");
      router.replace("/dashboard");
      return;
    }

    if (!sessionStorage.getItem(SESSION_KEY)) {
      // 플래그 없음 = 새 탭이거나 브라우저 재시작 → 강제 로그아웃
      logoutAction();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
