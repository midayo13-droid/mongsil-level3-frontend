"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, useBlobUrl, useFetch } from "@/lib/api";
import { formatDate, formatPrice, todayString } from "@/lib/format";
import { RecordForm } from "./forms";
import { Alert, confirmDelete, PageHead, State } from "./ui";

/** 미용 기록 등록 (관리사/관리 공용). dogId 가 있으면 그 강아지로 고정해요. */
export function RecordNewView({ backHref, dogId }: { backHref: string; dogId?: number }) {
  const router = useRouter();
  const back = dogId ? `/dogs/${dogId}` : backHref;
  return (
    <>
      <PageHead title="미용 기록 등록" sub="* 표시는 꼭 적어 주세요.">
        <Link href={back} className="btn">
          ← 돌아가기
        </Link>
      </PageHead>
      <section className="card">
        <RecordForm
          lockDog={!!dogId}
          initial={{
            dog_id: dogId ? String(dogId) : "",
            groomer_id: "",
            groomed_at: todayString(),
            style: "",
            price: "",
            memo: "",
          }}
          onCancel={() => router.push(back)}
          onDone={(id) => router.push(`/records/${id}`)}
        />
      </section>
    </>
  );
}

/** 미용 기록 수정 (관리 화면) */
export function RecordEditView({ recordId }: { recordId: number }) {
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/records/${recordId}`);
  const back = `/records/${recordId}`;
  return (
    <>
      <PageHead title="미용 기록 수정">
        <Link href={back} className="btn">
          ← 돌아가기
        </Link>
      </PageHead>
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <section className="card">
            <RecordForm
              recordId={recordId}
              hasPhoto={data.has_photo}
              initial={{
                dog_id: String(data.dog_id),
                groomer_id: String(data.groomer_id),
                groomed_at: data.groomed_at,
                style: data.style,
                price: String(data.price),
                memo: data.memo ?? "",
              }}
              onCancel={() => router.push(back)}
              onDone={() => router.push(back)}
            />
          </section>
        )}
      </State>
    </>
  );
}

/** 미용 기록 상세 (관리사/관리 공용) */
export function RecordDetailView({ recordId, admin }: { recordId: number; admin?: boolean }) {
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/records/${recordId}`);
  // 사진은 로그인이 필요해서, 로그인 정보를 담아 받아 와요.
  const photoUrl = useBlobUrl(data?.has_photo ? `/records/${recordId}/photo` : null);
  const [problem, setProblem] = useState<string | null>(null);
  const listHref = "/records";

  async function remove() {
    if (!confirmDelete("이 미용 기록을 삭제할까요?\n삭제하면 되돌릴 수 없어요.")) return;
    try {
      await api(`/records/${recordId}`, { method: "DELETE" });
      router.push(listHref);
    } catch (e: any) {
      setProblem(e.message);
    }
  }

  return (
    <>
      <PageHead title="미용 기록">
        <Link href={listHref} className="btn">
          ← 목록으로
        </Link>
        {admin && data && (
          <>
            <Link href={`/records/${recordId}/edit`} className="btn">
              수정
            </Link>
            <button className="btn danger" onClick={remove}>
              삭제
            </button>
          </>
        )}
      </PageHead>
      {problem && <Alert kind="error">{problem}</Alert>}
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <section className="card">
            <dl className="info">
              <dt>강아지</dt>
              <dd>
                <Link className="link" href={`/dogs/${data.dog_id}`}>
                  {data.dog_name}
                </Link>{" "}
                ({data.dog_breed})
              </dd>
              <dt>보호자</dt>
              <dd>
                {data.guardian_name}
              </dd>
              <dt>미용 날짜</dt>
              <dd>{formatDate(data.groomed_at)}</dd>
              <dt>스타일</dt>
              <dd>{data.style}</dd>
              <dt>담당 관리사</dt>
              <dd>{data.groomer_name}</dd>
              <dt>가격</dt>
              <dd>{formatPrice(data.price)}</dd>
              <dt>메모</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{data.memo || "-"}</dd>
              <dt>사진</dt>
              <dd>
                {data.has_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  photoUrl ? <img className="photo" src={photoUrl} alt="미용 사진" /> : "사진을 불러오는 중이에요..."
                ) : (
                  "등록된 사진이 없어요."
                )}
              </dd>
            </dl>
          </section>
        )}
      </State>
    </>
  );
}
