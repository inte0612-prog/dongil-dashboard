import { Suspense } from "react";
import RegistrarsContent from "./RegistrarsContent";

export default function RegistrarsPage() {
  return (
    <Suspense>
      <RegistrarsContent />
    </Suspense>
  );
}
