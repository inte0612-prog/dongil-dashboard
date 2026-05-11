/**
 * page.tsx — 로그인 페이지 (서버 컴포넌트)
 *
 * Next.js App Router에서 page.tsx는 기본적으로 서버 컴포넌트입니다.
 * 레이아웃(카드, 타이틀 등)은 여기서 렌더링하고,
 * 상태가 필요한 폼은 LoginForm(클라이언트 컴포넌트)으로 분리했습니다.
 */

import { LayoutDashboard } from "lucide-react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "로그인 | 동일유리 생산 대시보드",
};

export default function LoginPage() {
  return (
    // min-h-screen: 화면 전체 높이 / flex + items-center: 수직 중앙 정렬
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* 상단 로고 & 타이틀 */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">동일유리 생산 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">관리자 로그인이 필요합니다</p>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-lg border bg-background p-6 shadow-sm">
          <LoginForm />
        </div>

        {/* 하단 캡션 */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          오창공장 MES · 동일유리
        </p>

      </div>
    </div>
  );
}
