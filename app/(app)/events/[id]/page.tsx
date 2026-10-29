"use client";

import { useParams } from "next/navigation";
import { BoardDetail } from "@/components/lists";

export default function StaffEventDetailPage() {
  const params = useParams<{ id: string }>();
  return <BoardDetail kind="events" id={Number(params.id)} />;
}
