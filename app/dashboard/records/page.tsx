import { Suspense } from "react";
import RecordsContent from "./RecordsContent";

export default function RecordsPage() {
  return (
    <Suspense>
      <RecordsContent />
    </Suspense>
  );
}
