"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RecordNewView } from "@/components/record-views";

function Inner() {
  const search = useSearchParams();
  const dogId = Number(search.get("dog_id"));
  return <RecordNewView backHref="/records" dogId={Number.isInteger(dogId) && dogId > 0 ? dogId : undefined} />;
}

export default function StaffRecordNewPage() {
  return (
    <Suspense fallback={<p className="empty">불러오는 중이에요...</p>}>
      <Inner />
    </Suspense>
  );
}
