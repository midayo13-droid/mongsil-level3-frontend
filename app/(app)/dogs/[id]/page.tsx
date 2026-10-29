"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api, useFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { NoteForm } from "@/components/forms";
import { Alert, confirmDelete, PageHead, State } from "@/components/ui";

/** AI 미용 도우미: 미용 전 안내 3줄 요약 + 추천 스타일 */
function AiHelper({ dogId }: { dogId: number }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setError(null);
    try {
      setResult(await api(`/dogs/${dogId}/ai-helper`, { method: "POST" }));
    } catch (e: any) {
      setResult(null);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>🤖 AI 미용 도우미</h2>
        <button className="btn primary small" onClick={ask} disabled={busy}>
          {busy ? "만드는 중... (몇 초 걸려요)" : result ? "다시 만들기" : "미용 전 안내 만들기"}
        </button>
      </div>
      {!result && !error && (
        <p className="sub">주의사항과 지난 미용 기록을 읽고, 미용 전에 알아 둘 점을 3줄로 요약하고 어울리는 스타일을 추천해 줘요.</p>
      )}
      {error && <Alert kind="error">{error}</Alert>}
      {result && (
        <div className="ai-box">
          <b>미용 전 안내</b>
          <ol>
            {result.summary.map((line: string, i: number) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          <div>
            <b>추천 스타일: </b>
            {result.recommended_style ? <span className="badge">{result.recommended_style}</span> : "추천 없음"}
            {result.reason && <span className="sub"> {result.reason}</span>}
          </div>
          <p className="ai-note">
            AI가 만든 참고용 안내예요. 꼭 직접 확인해 주세요. 보호자 이름·연락처는 AI에 보내지 않아요. (오늘 {result.remaining}번 더 쓸 수 있어요)
          </p>
        </div>
      )}
    </section>
  );
}

export default function DogDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/dogs/${id}`);
  const [problem, setProblem] = useState<string | null>(null);

  async function removeNote(noteId: number) {
    if (!confirmDelete("이 주의사항을 삭제할까요?\n삭제하면 되돌릴 수 없어요.")) return;
    setProblem(null);
    try {
      await api(`/notes/${noteId}`, { method: "DELETE" });
      reload();
    } catch (e: any) {
      setProblem(e.message);
    }
  }

  /** 삭제는 사장님만. 마지막 강아지였다면 고객 정보도 함께 지울지 물어봐요. */
  async function removeDog() {
    if (!confirmDelete(`"${data.name}" 강아지를 삭제할까요?
이 강아지의 주의사항과 미용 기록도 함께 삭제되고, 되돌릴 수 없어요.`)) return;
    setProblem(null);
    try {
      await api(`/dogs/${id}`, { method: "DELETE" });
      const guardian = await api<any>(`/guardians/${data.guardian.id}`);
      if (
        guardian.dogs.length === 0 &&
        confirmDelete(`"${data.guardian.name}" 고객에게 남은 강아지가 없어요.
고객 정보도 함께 삭제할까요?`)
      ) {
        await api(`/guardians/${data.guardian.id}`, { method: "DELETE" });
      }
      router.push("/dogs");
    } catch (e: any) {
      setProblem(e.message);
    }
  }

  return (
    <>
      <PageHead title={data ? `${data.name} 상세` : "강아지 상세"}>
        <Link href="/dogs" className="btn">
          ← 목록으로
        </Link>
        {data && (
          <Link href={`/reservations/new?dog_id=${id}`} className="btn primary">
            + 예약 신청
          </Link>
        )}
        {data && isAdmin && (
          <button className="btn danger" onClick={removeDog}>
            강아지 삭제
          </button>
        )}
      </PageHead>
      {problem && <Alert kind="error">{problem}</Alert>}
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="grid">
              <section className="card">
                <div className="card-head">
                  <h2>강아지 정보</h2>
                  <Link href={`/dogs/${id}/edit`} className="btn small">
                    강아지 정보 수정
                  </Link>
                </div>
                <dl className="info">
                  <dt>이름</dt>
                  <dd>{data.name}</dd>
                  <dt>견종</dt>
                  <dd>{data.breed}</dd>
                  <dt>성별</dt>
                  <dd>{data.gender}</dd>
                  <dt>나이</dt>
                  <dd>{data.age}살</dd>
                  <dt>몸무게</dt>
                  <dd>{data.weight}kg</dd>
                  <dt>생일</dt>
                  <dd>{formatDate(data.birthday)}</dd>
                </dl>
              </section>

              <section className="card">
                <div className="card-head">
                  <h2>고객(보호자) 정보</h2>
                  <Link href={`/guardians/${data.guardian.id}/edit`} className="btn small">
                    고객 정보 수정
                  </Link>
                </div>
                <dl className="info">
                  <dt>이름</dt>
                  <dd>{data.guardian.name}</dd>
                  <dt>휴대폰</dt>
                  <dd>{data.guardian.phone}</dd>
                  <dt>이메일</dt>
                  <dd>{data.guardian.email}</dd>
                  <dt>비상연락처</dt>
                  <dd>
                    {data.guardian.emergency_name
                      ? `${data.guardian.emergency_name} ${data.guardian.emergency_phone ?? ""}`
                      : "-"}
                  </dd>
                  <dt>하고 싶은 말</dt>
                  <dd style={{ whiteSpace: "pre-wrap" }}>{data.guardian.message || "-"}</dd>
                </dl>
              </section>
            </div>

            <AiHelper dogId={id} />

            <section className="card">
              <h2>주의사항 (날짜별)</h2>
              {data.notes.length === 0 ? (
                <p className="empty">등록된 주의사항이 없어요.</p>
              ) : (
                <ul className="timeline">
                  {data.notes.map((n: any) => (
                    <li key={n.id}>
                      <div>
                        <div className="when">{formatDateTime(n.created_at)}</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{n.content}</div>
                      </div>
                      {isAdmin && (
                        <button className="btn small danger" onClick={() => removeNote(n.id)}>
                          삭제
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <NoteForm dogId={id} onDone={reload} />
              {!isAdmin && <p className="sub">주의사항 삭제는 사장님만 할 수 있어요.</p>}
            </section>

            <section className="card">
              <div className="card-head">
                <h2>미용 기록</h2>
                <Link href={`/records/new?dog_id=${id}`} className="btn small primary">
                  + 미용 기록 등록
                </Link>
              </div>
              {data.records.length === 0 ? (
                <p className="empty">미용 기록이 아직 없어요.</p>
              ) : (
                <ul className="list">
                  {data.records.map((r: any) => (
                    <li key={r.id}>
                      <Link href={`/records/${r.id}`} className="row">
                        <div className="title">
                          {formatDate(r.groomed_at)} · {r.style}
                        </div>
                        <div className="meta">
                          {r.groomer_name} · {formatPrice(r.price)}
                          {r.has_photo ? " · 사진 있음" : ""}
                          {r.memo ? ` · ${r.memo}` : ""}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </State>
    </>
  );
}
