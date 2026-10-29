"use client";

import { useParams } from "next/navigation";
import { RecordEditView } from "@/components/record-views";
import { AdminOnly } from "@/components/shell";

export default function RecordEditPage() {
  const params = useParams<{ id: string }>();
  return (
    <AdminOnly>
      <RecordEditView recordId={Number(params.id)} />
    </AdminOnly>
  );
}
