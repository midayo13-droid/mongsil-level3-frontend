"use client";

import { useParams } from "next/navigation";
import { RecordDetailView } from "@/components/record-views";
import { useAuth } from "@/lib/auth";

export default function RecordDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  return <RecordDetailView recordId={Number(params.id)} admin={isAdmin} />;
}
