import { Suspense } from "react";
import ClientsContent from "./ClientsContent";

export default function ClientsPage() {
  return (
    <Suspense>
      <ClientsContent />
    </Suspense>
  );
}
