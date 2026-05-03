import { Suspense } from "react";
import DimensionsContent from "./DimensionsContent";

export default function DimensionsPage() {
  return (
    <Suspense>
      <DimensionsContent />
    </Suspense>
  );
}
