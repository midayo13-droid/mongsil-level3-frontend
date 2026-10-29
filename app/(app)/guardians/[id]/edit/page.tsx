"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { GuardianEditView } from "@/components/edit-views";
import { useFetch } from "@/lib/api";

/** 관리자 화면: 고객 정보를 수정할 수 있어요. (삭제 기능은 없어요.) */
export default function StaffGuardianEditPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  // 저장하고 나면 그 고객의 첫 번째 강아지 상세로 돌아가요. 강아지가 없으면 강아지 목록으로 가요.
  const { data } = useFetch<any>(`/guardians/${id}`);
  const back = data?.dogs?.[0] ? `/dogs/${data.dogs[0].id}` : "/dogs";
  useEffect(() => {
    router.prefetch(back);
  }, [router, back]);
  return <GuardianEditView guardianId={id} backHref={back} />;
}
