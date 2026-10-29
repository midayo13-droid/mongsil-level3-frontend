"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, useFetch, usePaged } from "@/lib/api";
import { formatDate, formatDateTime, todayString } from "@/lib/format";
import { FormMessage, useOptions, useSubmit } from "./forms";
import { Alert, confirmDelete, Field, ListTotal, PageHead, Pagination, SearchBar, State } from "./ui";

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ---------- R1. 예약 시간표 (관리사별 × 30분) ---------- */

/** 예약관리 위쪽 "시간표/목록" 선택 상자 */
function ViewSelect({ value }: { value: "board" | "list" }) {
  const router = useRouter();
  return (
    <select
      aria-label="보기 방식"
      value={value}
      onChange={(e) => router.replace(e.target.value === "list" ? "/reservations?view=list" : "/reservations")}
      style={{ width: "auto" }}
    >
      <option value="board">시간표</option>
      <option value="list">목록</option>
    </select>
  );
}

/** 예약관리: 기본은 시간표, 위쪽 선택 상자로 목록과 바꿔 봐요. */
export function ReservationManageView() {
  const view = useSearchParams().get("view");
  return view === "list" ? <ReservationListView /> : <BoardView />;
}

export function BoardView() {
  const router = useRouter();
  const [date, setDate] = useState(todayString());
  const { data, error, loading, reload } = useFetch<any>(`/reservations/board?date=${date}`);
  const today = todayString();
  const now = nowTime();

  const isPast = (slot: string) => date < today || (date === today && slot <= now);

  return (
    <>
      <PageHead title="예약관리" sub="빈 칸을 누르면 그 시간으로 바로 예약을 신청해요. 예약된 칸을 누르면 상세가 열려요.">
        <ViewSelect value="board" />
        <Link href="/reservations/new" className="btn primary">
          + 예약 신청
        </Link>
      </PageHead>

      <div className="date-nav">
        <button className="btn" onClick={() => setDate(addDays(date, -1))}>
          ← 전날
        </button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <button className="btn" onClick={() => setDate(addDays(date, 1))}>
          다음날 →
        </button>
        {date !== today && (
          <button className="btn" onClick={() => setDate(today)}>
            오늘
          </button>
        )}
      </div>

      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {data.closed && <div className="board-closed">🚫 이 날은 쉬는 날이에요 ({data.closed}). 예약을 신청할 수 없어요.</div>}
            <div className="legend">
              <span>
                <i style={{ background: "#fff" }} />
                빈 시간
              </span>
              <span>
                <i style={{ background: "#d5eeee" }} />
                예약됨
              </span>
              <span>
                <i style={{ background: "#f1f4f4" }} />
                지난 시간
              </span>
              <span>관리사 한 명당 하루 최대 {data.max_per_groomer}건</span>
            </div>
            {data.groomers.length === 0 ? (
              <p className="empty">근무 중인 관리사가 없어요.</p>
            ) : (
              <section className="card board-wrap" style={{ padding: 0 }}>
                <table className="board">
                  <thead>
                    <tr>
                      <th className="time-col">시간</th>
                      {data.groomers.map((g: any) => (
                        <th key={g.id}>
                          {g.name}
                          <div style={{ fontWeight: 500, color: g.count >= data.max_per_groomer ? "var(--danger)" : "var(--muted)" }}>
                            {g.count}/{data.max_per_groomer}건
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slots.map((slot: string) => (
                      <tr key={slot}>
                        <td className="time-col">{slot}</td>
                        {data.groomers.map((g: any) => {
                          const booked = g.reservations.find((r: any) => r.reserved_time === slot);
                          if (booked) {
                            return (
                              <td key={g.id}>
                                <button className="slot taken" onClick={() => router.push(`/reservations/${booked.id}`)}>
                                  {booked.dog_name} · {booked.style}
                                </button>
                              </td>
                            );
                          }
                          const blocked = !!data.closed || isPast(slot);
                          return (
                            <td key={g.id}>
                              <button
                                className={`slot ${blocked ? "past" : "free"}`}
                                disabled={blocked}
                                onClick={() => router.push(`/reservations/new?date=${date}&time=${slot}&groomer_id=${g.id}`)}
                              >
                                {blocked ? "" : "＋ 신청"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </State>
    </>
  );
}

/* ---------- R2. 예약 목록 (검색·필터) ---------- */

export function ReservationListView() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (status) params.set("status", status);
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/reservations", params.toString());

  return (
    <>
      <PageHead title="예약관리" sub="강아지 이름·관리사·스타일로 찾고, 날짜 범위와 상태로 걸러 볼 수 있어요.">
        <ViewSelect value="list" />
        <Link href="/reservations/new" className="btn primary">
          + 예약 신청
        </Link>
      </PageHead>
      <SearchBar placeholder="강아지 이름 · 관리사 · 스타일 검색" onSearch={setQ} />
      <div className="filters">
        <div className="field">
          <label>시작 날짜</label>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>끝 날짜</label>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="field">
          <label>상태</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">전체</option>
            <option value="신청">신청</option>
            <option value="취소">취소</option>
          </select>
        </div>
        {(from || to || status) && (
          <button
            className="btn"
            style={{ alignSelf: "flex-end", marginBottom: 14 }}
            onClick={() => {
              setFrom("");
              setTo("");
              setStatus("");
            }}
          >
            필터 지우기
          </button>
        )}
      </div>
      <section className="card">
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="찾은 예약이 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>시간</th>
                  <th>강아지</th>
                  <th>관리사</th>
                  <th>스타일</th>
                  <th>상태</th>
                  <th>신청한 사람</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.reserved_date)}</td>
                    <td>{r.reserved_time}</td>
                    <td>
                      <Link className="title-link" href={`/reservations/${r.id}`}>
                        {r.dog_name}
                      </Link>
                    </td>
                    <td>{r.groomer_name}</td>
                    <td>{r.style}</td>
                    <td>
                      <span className={`badge ${r.status === "신청" ? "green" : "gray"}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.created_by_role === "고객" ? <span className="badge">고객이 직접</span> : (r.created_by_name ?? "-")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </State>
      </section>
    </>
  );
}

/* ---------- R3. 예약 신청 ---------- */

export function ReservationNewView() {
  const router = useRouter();
  const search = useSearchParams();
  const options = useOptions();
  const dogs = useFetch<any[]>("/dogs");
  const groomers = useFetch<any[]>("/groomers?status=%EA%B7%BC%EB%AC%B4%EC%A4%91");
  const [value, setValue] = useState({
    dog_id: search.get("dog_id") ?? "",
    groomer_id: search.get("groomer_id") ?? "",
    reserved_date: search.get("date") ?? "",
    reserved_time: search.get("time") ?? "",
    style: "",
    memo: "",
  });
  const { errors, message, busy, run } = useSubmit();
  const set = (patch: Partial<typeof value>) => setValue({ ...value, ...patch });
  // 처음 들어오면 목록의 첫 번째 강아지가 미리 골라져 있어요. (강아지 화면에서 들어오면 그 강아지)
  const dogId = value.dog_id || (dogs.data?.length ? String(dogs.data[0].id) : "");

  return (
    <>
      <PageHead title="예약 신청" sub="전화로 받은 예약을 입력해요. * 표시는 꼭 적어 주세요.">
        <Link href="/reservations" className="btn">
          ← 예약관리로
        </Link>
      </PageHead>
      <section className="card">
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            await run(async () => {
              const result = await api<{ id: number }>("/reservations", { method: "POST", body: { ...value, dog_id: dogId } });
              router.push(`/reservations/${result.id}`);
            });
          }}
        >
          <FormMessage message={message} errors={errors} />
          <div className="form-grid">
            <Field label="강아지" required error={errors.dog_id}>
              <select value={dogId} onChange={(e) => set({ dog_id: e.target.value })}>
                <option value="">선택해 주세요</option>
                {(dogs.data ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.guardian_name})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="담당 관리사" required error={errors.groomer_id} hint="근무 중인 관리사만 보여요">
              <select value={value.groomer_id} onChange={(e) => set({ groomer_id: e.target.value })}>
                <option value="">선택해 주세요</option>
                {(groomers.data ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="예약 날짜" required error={errors.reserved_date} hint="일요일·휴무일은 신청할 수 없어요">
              <input
                type="date"
                value={value.reserved_date}
                min={todayString()}
                onChange={(e) => set({ reserved_date: e.target.value })}
              />
            </Field>
            <Field label="예약 시간" required error={errors.reserved_time} hint="10:00 ~ 17:30, 30분 단위">
              <select value={value.reserved_time} onChange={(e) => set({ reserved_time: e.target.value })}>
                <option value="">선택해 주세요</option>
                {options?.times.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="희망 스타일" required error={errors.style}>
              <select value={value.style} onChange={(e) => set({ style: e.target.value })}>
                <option value="">선택해 주세요</option>
                {options?.styles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="요청 메모" error={errors.memo} full>
              <textarea value={value.memo} maxLength={300} onChange={(e) => set({ memo: e.target.value })} placeholder="예: 발톱을 짧게 부탁하셨어요." />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "신청 중..." : "예약 신청하기"}
            </button>
            <button className="btn" type="button" onClick={() => router.push("/reservations")}>
              취소
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

/* ---------- R4. 예약 상세·취소 ---------- */

export function ReservationDetailView({ id }: { id: number }) {
  const { data, error, loading, reload } = useFetch<any>(`/reservations/${id}`);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!confirmDelete("이 예약을 취소할까요?\n취소한 예약은 되돌릴 수 없어요.")) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api<{ message: string }>(`/reservations/${id}/cancel`, { method: "POST" });
      setResult({ kind: "ok", text: r.message });
      reload();
    } catch (e: any) {
      setResult({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="예약 상세">
        <Link href="/reservations?view=list" className="btn">
          ← 예약관리
        </Link>
        {data?.status === "신청" && (
          <button className="btn danger" onClick={cancel} disabled={busy}>
            예약 취소
          </button>
        )}
      </PageHead>
      {result && <Alert kind={result.kind}>{result.text}</Alert>}
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <section className="card">
            <dl className="info">
              <dt>상태</dt>
              <dd>
                <span className={`badge ${data.status === "신청" ? "green" : "gray"}`}>{data.status}</span>
              </dd>
              <dt>강아지</dt>
              <dd>
                <Link className="link" href={`/dogs/${data.dog_id}`}>
                  {data.dog_name}
                </Link>{" "}
                ({data.dog_breed})
              </dd>
              <dt>보호자</dt>
              <dd>{data.guardian_name}</dd>
              <dt>예약 일시</dt>
              <dd>
                {formatDate(data.reserved_date)} {data.reserved_time}
              </dd>
              <dt>담당 관리사</dt>
              <dd>{data.groomer_name}</dd>
              <dt>희망 스타일</dt>
              <dd>{data.style}</dd>
              <dt>요청 메모</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{data.memo || "-"}</dd>
              <dt>신청한 사람</dt>
              <dd>{data.created_by_role === "고객" ? `${data.created_by_name} (고객이 직접 신청)` : (data.created_by_name ?? "-")}</dd>
              <dt>신청 일시</dt>
              <dd>{formatDateTime(data.created_at)}</dd>
              {data.status === "취소" ? (
                <>
                  <dt>취소 일시</dt>
                  <dd>{formatDateTime(data.canceled_at)}</dd>
                </>
              ) : (
                <>
                  <dt>취소 마감</dt>
                  <dd>
                    {data.cancel_deadline} 까지 {data.cancelable ? "" : "(마감이 지났어요. 취소하려면 매장으로 전화해 주세요.)"}
                  </dd>
                </>
              )}
            </dl>
          </section>
        )}
      </State>
    </>
  );
}
