"use client";

import { Suspense } from "react";
import { ReservationManageView } from "@/components/reservation-views";

export default function ReservationsPage() {
  return (
    <Suspense fallback={null}>
      <ReservationManageView />
    </Suspense>
  );
}
