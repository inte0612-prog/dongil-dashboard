import { Suspense } from "react";
import AiChatContent from "./AiChatContent";

export const metadata = { title: "AI 분석 | 동일산업 대시보드" };

export default function AiPage() {
  return (
    <Suspense>
      <div className="flex h-full flex-col">
        <AiChatContent />
      </div>
    </Suspense>
  );
}
