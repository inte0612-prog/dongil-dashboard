import { Suspense } from "react";
import ClientSpecContent from "./ClientSpecContent";

export default function ClientSpecPage() {
  return (
    <Suspense>
      <ClientSpecContent />
    </Suspense>
  );
}
