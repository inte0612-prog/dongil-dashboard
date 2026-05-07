import { Suspense } from "react";
import PivotContent from "./PivotContent";

export default function PivotPage() {
  return (
    <Suspense>
      <PivotContent />
    </Suspense>
  );
}
