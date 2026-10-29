"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetch } from "@/lib/api";
import { DogForm, GuardianEditForm, type DogValue, type GuardianValue } from "./forms";
import { PageHead, State } from "./ui";

/** 관리자 화면에서 함께 쓰는 "고객 정보 수정" 화면 */
export function GuardianEditView({ guardianId, backHref }: { guardianId: number; backHref: string }) {
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/guardians/${guardianId}`);
  const initial: GuardianValue | null = data && {
    name: data.name ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    emergency_name: data.emergency_name ?? "",
    emergency_phone: data.emergency_phone ?? "",
    message: data.message ?? "",
  };
  return (
    <>
      <PageHead title="고객 정보 수정" sub="고친 뒤 '저장하기'를 눌러 주세요.">
        <Link href={backHref} className="btn">
          ← 돌아가기
        </Link>
      </PageHead>
      <State loading={loading} error={error} onRetry={reload}>
        {initial && (
          <section className="card">
            <GuardianEditForm
              guardianId={guardianId}
              initial={initial}
              onDone={() => router.push(backHref)}
              onCancel={() => router.push(backHref)}
            />
          </section>
        )}
      </State>
    </>
  );
}

/** 관리자 화면에서 함께 쓰는 "강아지 정보 수정" 화면 */
export function DogEditView({ dogId, backHref }: { dogId: number; backHref: string }) {
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/dogs/${dogId}`);
  const initial: DogValue | null = data && {
    name: data.name ?? "",
    breed: data.breed ?? "",
    gender: data.gender ?? "",
    age: String(data.age ?? ""),
    weight: String(data.weight ?? ""),
    birthday: data.birthday ?? "",
    note: "",
  };
  return (
    <>
      <PageHead title="강아지 정보 수정" sub="고친 뒤 '저장하기'를 눌러 주세요.">
        <Link href={backHref} className="btn">
          ← 돌아가기
        </Link>
      </PageHead>
      <State loading={loading} error={error} onRetry={reload}>
        {initial && (
          <section className="card">
            <DogForm
              mode="edit"
              id={dogId}
              initial={initial}
              onDone={() => router.push(backHref)}
              onCancel={() => router.push(backHref)}
            />
          </section>
        )}
      </State>
    </>
  );
}
