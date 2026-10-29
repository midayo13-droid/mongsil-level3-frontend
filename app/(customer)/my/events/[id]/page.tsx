"use client";

import { useParams } from "next/navigation";
import { BoardReadView } from "@/components/customer-views";

export default function MyEventPage() {
  const params = useParams<{ id: string }>();
  return <BoardReadView kind="events" id={Number(params.id)} />;
}
