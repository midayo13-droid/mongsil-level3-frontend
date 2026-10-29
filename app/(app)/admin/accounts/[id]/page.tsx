"use client";

import { useParams } from "next/navigation";
import { AdminOnly } from "@/components/shell";
import { CustomerDetailView } from "@/components/admin-detail-views";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <AdminOnly>
      <CustomerDetailView id={Number(params.id)} />
    </AdminOnly>
  );
}
