import { Suspense } from "react";
import HeatmapContent from "./HeatmapContent";

export default function HeatmapPage() {
  return (
    <Suspense>
      <HeatmapContent />
    </Suspense>
  );
}
