"use client";

import { Suspense } from "react";
import { ReserveView } from "@/components/customer-views";

export default function ReservePage() {
  return (
    <Suspense fallback={<p className="empty">불러오는 중이에요...</p>}>
      <ReserveView />
    </Suspense>
  );
}
