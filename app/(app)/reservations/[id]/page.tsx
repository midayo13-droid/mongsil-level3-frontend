"use client";

import { useParams } from "next/navigation";
import { ReservationDetailView } from "@/components/reservation-views";

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  return <ReservationDetailView id={Number(params.id)} />;
}
