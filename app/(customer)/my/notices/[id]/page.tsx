"use client";

import { useParams } from "next/navigation";
import { BoardReadView } from "@/components/customer-views";

export default function MyNoticePage() {
  const params = useParams<{ id: string }>();
  return <BoardReadView kind="notices" id={Number(params.id)} />;
}
