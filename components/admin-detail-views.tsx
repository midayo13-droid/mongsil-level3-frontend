"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, useFetch } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { StaffForm } from "./staff-views";
import { Alert, confirmDelete, PageHead, State } from "./ui";

/** 사장님 전용 상세 화면 2개(관리사 · 고객)가 함께 쓰는 "이름 : 값" 줄 */
function Info({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="info">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- 관리사 상세 ---------- */

export function GroomerDetailView({ id }: { id: number }) {
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/groomers/${id}/overview`);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function remove() {
    if (!data) return;
    if (!confirmDelete(`"${data.name}" 관리사를 삭제할까요?${data.account_username ? "\n로그인 계정도 함께 삭제돼요." : ""}\n삭제하면 되돌릴 수 없어요.`)) return;
    try {
      await api(`/groomers/${id}`, { method: "DELETE" });
      router.push("/admin/groomers");
    } catch (e: any) {
      setMessage({ kind: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHead title="관리사 상세">
        <Link href="/admin/groomers" className="btn">
          ← 관리사 관리
        </Link>
        {data && !editing && (
          <>
            <button className="btn" onClick={() => setEditing(true)}>
              수정
            </button>
            <button className="btn danger" onClick={remove}>
              삭제
            </button>
          </>
        )}
      </PageHead>
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <section className="card">
              {editing ? (
                <StaffForm
                  id={id}
                  initial={{ name: data.name, phone: data.phone ?? "", status: data.status }}
                  accountUsername={data.account_username}
                  onCancel={() => setEditing(false)}
                  onDone={(text) => {
                    setEditing(false);
                    setMessage({ kind: "ok", text });
                    reload();
                  }}
                />
              ) : (
                <>
                  <h2>
                    {data.name} <span className={`badge ${data.status === "근무중" ? "green" : "gray"}`}>{data.status}</span>
                  </h2>
                  <Info
                    rows={[
                      ["휴대폰", data.phone ?? "-"],
                      ["로그인 계정", data.account_username ? `${data.account_username} (일반관리자)` : "없음 (로그인할 수 없어요)"],
                      ["등록일", formatDate(data.created_at)],
                      ["미용 기록", `${data.record_count}건`],
                      ["예약", `신청 ${data.reservation_count}건 (앞으로 ${data.upcoming_count}건)`],
                    ]}
                  />
                </>
              )}
            </section>

            <div className="grid">
              <section className="card">
                <div className="card-head">
                  <h2>앞으로의 예약</h2>
                </div>
                {data.upcoming_reservations.length === 0 ? (
                  <p className="empty">앞으로 잡힌 예약이 없어요.</p>
                ) : (
                  <ul className="list">
                    {data.upcoming_reservations.map((r: any) => (
                      <li key={r.id}>
                        <Link href={`/reservations/${r.id}`} className="row">
                          <div className="title">
                            {formatDate(r.reserved_date)} {r.reserved_time}
                          </div>
                          <div className="meta">
                            {r.dog_name} · {r.style}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card">
                <div className="card-head">
                  <h2>최근 미용 기록</h2>
                </div>
                {data.recent_records.length === 0 ? (
                  <p className="empty">미용 기록이 아직 없어요.</p>
                ) : (
                  <ul className="list">
                    {data.recent_records.map((r: any) => (
                      <li key={r.id}>
                        <Link href={`/records/${r.id}`} className="row">
                          <div className="title">
                            {r.dog_name} · {r.style}
                          </div>
                          <div className="meta">
                            {formatDate(r.groomed_at)} · {formatPrice(r.price)}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </State>
    </>
  );
}

/* ---------- 고객(계정) 상세 ---------- */

export function CustomerDetailView({ id }: { id: number }) {
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/users/${id}`);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function remove() {
    if (!data) return;
    if (!confirmDelete(`"${data.user.name}" 고객 계정을 지울까요?\n지우면 이 계정으로 로그인할 수 없어요.\n(고객의 보호자·강아지 정보는 그대로 남아요)`)) return;
    try {
      await api(`/users/${id}`, { method: "DELETE" });
      router.push("/admin/accounts");
    } catch (e: any) {
      setMessage({ kind: "error", text: e.message });
    }
  }

  const g = data?.guardian;
  return (
    <>
      <PageHead title="고객 상세">
        <Link href="/admin/accounts" className="btn">
          ← 고객 관리
        </Link>
        {g && (
          <Link href={`/guardians/${g.id}/edit`} className="btn">
            고객 정보 수정
          </Link>
        )}
        {data && (
          <button className="btn danger" onClick={remove}>
            계정 삭제
          </button>
        )}
      </PageHead>
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="grid">
              <section className="card">
                <div className="card-head">
                  <h2>계정</h2>
                </div>
                <Info
                  rows={[
                    ["아이디", data.user.username],
                    ["이름", data.user.name],
                    ["가입일", formatDate(data.user.created_at)],
                    ["예약", `앞으로 ${data.upcoming_count}건 · 전체 ${data.total_count}건`],
                  ]}
                />
              </section>
              <section className="card">
                <div className="card-head">
                  <h2>보호자 정보</h2>
                </div>
                {g ? (
                  <Info
                    rows={[
                      ["이름", g.name],
                      ["휴대폰", g.phone],
                      ["이메일", g.email || "-"],
                      ["비상 연락처", g.emergency_name || g.emergency_phone ? `${g.emergency_name ?? ""} ${g.emergency_phone ?? ""}`.trim() : "-"],
                      ["남기신 말", <span key="m" style={{ whiteSpace: "pre-wrap" }}>{g.message || "-"}</span>],
                    ]}
                  />
                ) : (
                  <p className="empty">연결된 보호자 정보가 없어요.</p>
                )}
              </section>
            </div>

            <div className="grid">
              <section className="card">
                <div className="card-head">
                  <h2>강아지 ({data.dogs.length})</h2>
                </div>
                {data.dogs.length === 0 ? (
                  <p className="empty">등록된 강아지가 없어요.</p>
                ) : (
                  <ul className="list">
                    {data.dogs.map((d: any) => (
                      <li key={d.id}>
                        <Link href={`/dogs/${d.id}`} className="row">
                          <div className="title">
                            {d.name} <span className="badge">{d.breed}</span>
                          </div>
                          <div className="meta">
                            {d.gender} · {d.age}살
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card">
                <div className="card-head">
                  <h2>최근 예약</h2>
                </div>
                {data.reservations.length === 0 ? (
                  <p className="empty">예약이 아직 없어요.</p>
                ) : (
                  <ul className="list">
                    {data.reservations.map((r: any) => (
                      <li key={r.id}>
                        <Link href={`/reservations/${r.id}`} className="row">
                          <div className="title">
                            {formatDate(r.reserved_date)} {r.reserved_time}{" "}
                            {r.status !== "신청" && <span className="badge gray">{r.status}</span>}
                          </div>
                          <div className="meta">
                            {r.dog_name} · {r.style}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </State>
    </>
  );
}
