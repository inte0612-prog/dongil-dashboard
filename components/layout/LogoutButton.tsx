"use client";

/**
 * LogoutButton.tsx — 로그아웃 버튼 컴포넌트
 *
 * form + 서버 액션 방식을 사용합니다.
 * 클라이언트에서 logoutAction(서버 액션)을 form의 action으로 직접 전달할 수 있습니다.
 * 버튼 클릭 → 서버에서 쿠키 삭제 → /login 리다이렉트
 */

import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>로그아웃</span>
      </button>
    </form>
  );
}
