import { Suspense } from "react";
import ItemsContent from "./ItemsContent";

export default function ItemsPage() {
  return (
    <Suspense>
      <ItemsContent />
    </Suspense>
  );
}
