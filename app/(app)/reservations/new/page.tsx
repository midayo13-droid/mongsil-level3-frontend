"use client";

import { Suspense } from "react";
import { ReservationNewView } from "@/components/reservation-views";

export default function NewReservationPage() {
  return (
    <Suspense fallback={<p className="empty">불러오는 중이에요...</p>}>
      <ReservationNewView />
    </Suspense>
  );
}
