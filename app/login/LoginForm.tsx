"use client";

/**
 * LoginForm.tsx — 로그인 폼 클라이언트 컴포넌트
 *
 * "use client"가 필요한 이유:
 *   useActionState 훅은 브라우저에서만 동작합니다.
 *   서버 컴포넌트인 page.tsx와 분리하여 클라이언트 번들을 최소화합니다.
 */

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Lock } from "lucide-react";

export default function LoginForm() {
  // useActionState: 서버 액션의 반환값(에러 메시지)과 로딩 상태를 관리
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      {/* 에러 메시지 표시 영역 */}
      {state?.error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* 아이디 입력 */}
      <div className="space-y-1.5">
        <label htmlFor="id" className="text-sm font-medium text-foreground">
          아이디
        </label>
        <Input
          id="id"
          name="id"
          type="text"
          placeholder="아이디를 입력하세요"
          autoComplete="username"
          required
          disabled={isPending}
        />
      </div>

      {/* 비밀번호 입력 */}
      <div className="space-y-1.5">
        <label htmlFor="pw" className="text-sm font-medium text-foreground">
          비밀번호
        </label>
        <Input
          id="pw"
          name="pw"
          type="password"
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
          required
          disabled={isPending}
        />
        {/* 테스트 계정 안내 문구 */}
        <p className="text-xs text-muted-foreground">
          테스트 계정 &nbsp;|&nbsp; 아이디 : admin &nbsp;/&nbsp; 비밀번호 : admin1234
        </p>
      </div>

      {/* 로그인 버튼 */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            로그인 중...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            로그인
          </>
        )}
      </Button>
    </form>
  );
}
