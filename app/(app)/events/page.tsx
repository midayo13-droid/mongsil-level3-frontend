"use client";

import { EventsView } from "@/components/lists";
import { useAuth } from "@/lib/auth";

export default function EventsPage() {
  const { isAdmin } = useAuth();
  // 등록·수정·삭제 버튼은 사장님에게만 보여요.
  return <EventsView admin={isAdmin} />;
}
