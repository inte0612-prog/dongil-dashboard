import { Suspense } from "react";
import OrdersContent from "./OrdersContent";

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
