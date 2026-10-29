"use client";

import { RecordsView } from "@/components/lists";
import { useAuth } from "@/lib/auth";

export default function RecordsPage() {
  const { isAdmin } = useAuth();
  // 수정·삭제 버튼은 사장님에게만 보여요. (서버도 사장님만 허용해요)
  return <RecordsView admin={isAdmin} />;
}
