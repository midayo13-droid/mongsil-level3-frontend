"use client";

import { useParams } from "next/navigation";
import { AdminOnly } from "@/components/shell";
import { GroomerDetailView } from "@/components/admin-detail-views";

export default function GroomerDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <AdminOnly>
      <GroomerDetailView id={Number(params.id)} />
    </AdminOnly>
  );
}
