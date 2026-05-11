import { Suspense } from "react";
import AiContent from "./AiContent";

export default function AiPage() {
  return (
    <Suspense>
      <AiContent />
    </Suspense>
  );
}
