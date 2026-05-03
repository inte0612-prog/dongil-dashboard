import { Suspense } from "react";
import SpecContent from "./SpecContent";

export default function SpecPage() {
  return (
    <Suspense>
      <SpecContent />
    </Suspense>
  );
}
