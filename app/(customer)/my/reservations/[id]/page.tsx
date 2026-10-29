"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { MyReservationDetailView } from "@/components/customer-views";

export default function MyReservationPage() {
  const params = useParams<{ id: string }>();
  return (
    <Suspense fallback={<p className="empty">불러오는 중이에요...</p>}>
      <MyReservationDetailView id={Number(params.id)} />
    </Suspense>
  );
}
