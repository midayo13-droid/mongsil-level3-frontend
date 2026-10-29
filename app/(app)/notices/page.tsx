"use client";

import { NoticesView } from "@/components/lists";
import { useAuth } from "@/lib/auth";

export default function NoticesPage() {
  const { isAdmin } = useAuth();
  // 등록·수정·삭제 버튼은 사장님에게만 보여요.
  return <NoticesView admin={isAdmin} />;
}
