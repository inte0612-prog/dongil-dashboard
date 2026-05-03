import { Suspense } from "react";
import TrendContent from "./TrendContent";

export default function TrendPage() {
  return (
    <Suspense>
      <TrendContent />
    </Suspense>
  );
}
