"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/forms";
import { api } from "@/lib/api";
import { PageHead } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  return (
    <>
      <PageHead title="신규 등록" sub="고객(보호자) 한 분과 강아지를 함께 등록해요. * 표시는 꼭 적어 주세요.">
        <Link href="/" className="btn">
          ← 홈으로
        </Link>
      </PageHead>
      <RegisterForm
        onCancel={() => router.push("/")}
        onDone={async (guardianId) => {
          // 등록이 끝나면 방금 등록한 첫 번째 강아지 화면으로 가요.
          try {
            const g = await api<any>(`/guardians/${guardianId}`);
            router.push(g.dogs?.[0] ? `/dogs/${g.dogs[0].id}` : "/dogs");
          } catch {
            router.push("/dogs");
          }
        }}
      />
    </>
  );
}
