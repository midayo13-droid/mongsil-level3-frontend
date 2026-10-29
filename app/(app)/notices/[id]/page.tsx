"use client";

import { useParams } from "next/navigation";
import { BoardDetail } from "@/components/lists";

export default function StaffNoticeDetailPage() {
  const params = useParams<{ id: string }>();
  return <BoardDetail kind="notices" id={Number(params.id)} />;
}
