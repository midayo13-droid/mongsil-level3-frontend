"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, useFetch, useInfinite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime, formatPrice, todayString } from "@/lib/format";
import {
  DogFields,
  emptyDog,
  FormMessage,
  GuardianFields,
  useOptions,
  useSubmit,
  type DogValue,
  type GuardianValue,
} from "./forms";
import { EventImage, EventLink, NoticeFiles } from "./board-extras";
import { Alert, confirmDelete, Field, InfiniteFooter, ListTotal, State } from "./ui";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-11-03" → "11월 3일 (화)" */
export function niceDate(date: string) {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEK[d.getUTCDay()]})`;
}

function Heading({ title, sub, back }: { title: string; sub?: string; back?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {back && (
        <Link href={back} className="link" style={{ fontSize: 14 }}>
          ‹ 뒤로
        </Link>
      )}
      <h1>{title}</h1>
      {sub && <p className="sub">{sub}</p>}
    </div>
  );
}

function SectionTitle({ title, href, more = "전체 보기 ›" }: { title: string; href?: string; more?: string }) {
  return (
    <div className="cust-section">
      <h2>{title}</h2>
      {href && (
        <Link href={href} className="link" style={{ fontSize: 14 }}>
          {more}
        </Link>
      )}
    </div>
  );
}

/** 예약 카드. canCancel 이면 "예약 취소" 버튼이 같이 보여요. */
function ReservationCard({ r, onChanged, showCancel }: { r: any; onChanged?: () => void; showCancel?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function cancel() {
    if (!confirmDelete(`${niceDate(r.reserved_date)} ${r.reserved_time} ${r.dog_name} 예약을 취소할까요?\n취소한 예약은 되돌릴 수 없어요.`)) return;
    setBusy(true);
    setProblem(null);
    try {
      await api(`/me/reservations/${r.id}/cancel`, { method: "POST" });
      onChanged?.();
    } catch (e: any) {
      setProblem(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="res-card">
      <div className="datebox" aria-hidden>
        <small>
          {Number(r.reserved_date.slice(5, 7))}월 {WEEK[new Date(`${r.reserved_date.slice(0, 10)}T00:00:00Z`).getUTCDay()]}
        </small>
        <b>{Number(r.reserved_date.slice(8, 10))}</b>
      </div>
      <Link href={`/my/reservations/${r.id}`}>
        <div className="when">
          {niceDate(r.reserved_date)} {r.reserved_time}
        </div>
        <div className="meta">
          {r.dog_name} · {r.style} · {r.groomer_name} 관리사
        </div>
      </Link>
      <div className="row-end">
        <span className={`badge ${r.status === "신청" ? "" : "gray"}`}>{r.status === "신청" ? "예약 확정" : "취소됨"}</span>
        {showCancel && r.status === "신청" &&
          (r.cancelable ? (
            <button className="btn small danger" onClick={cancel} disabled={busy}>
              예약 취소
            </button>
          ) : (
            <span className="meta">당일 00시가 지나 취소할 수 없어요 · 매장으로 전화해 주세요</span>
          ))}
      </div>
      {problem && <div className="error-text">{problem}</div>}
    </div>
  );
}

/* ---------- C2. 내 홈 ---------- */

export function CustomerHome() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch<any>("/me/summary");
  return (
    <>
      <div className="cust-hero">
        <h1>{user?.name}님, 안녕하세요</h1>
        <Link href="/my/reserve" className="btn big hero-reserve">
          <span>
            ✂️ 미용 예약하기
            <small>원하는 날짜와 시간을 선택해주세요</small>
          </span>
        </Link>
      </div>
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <SectionTitle title={`다가오는 예약 (${data.upcoming_count}건)`} href="/my/reservations" />
            {data.upcoming.length === 0 ? (
              <p className="empty">다가오는 예약이 없어요.</p>
            ) : (
              data.upcoming.map((r: any) => <ReservationCard key={r.id} r={r} />)
            )}

            <SectionTitle title="내 강아지" href="/my/dogs" />
            {data.dogs.map((d: any) => (
              <Link key={d.id} href={`/my/dogs/${d.id}`} className="dog-card">
                <div className="name">{d.name}</div>
                <div className="meta">
                  {d.breed} · {d.gender} · {d.age}살
                </div>
              </Link>
            ))}

            <SectionTitle title="공지사항" href="/my/notices" />
            {data.notices.length === 0 ? (
              <p className="empty">공지사항이 없어요.</p>
            ) : (
              data.notices.map((n: any) => (
                <Link key={n.id} href={`/my/notices/${n.id}`} className="dog-card">
                  <div className="name">
                    {n.title} {n.file_count > 0 && <span className="badge gray">📎 첨부 {n.file_count}</span>}
                  </div>
                  <div className="meta">{formatDate(n.created_at)}</div>
                </Link>
              ))
            )}

            <SectionTitle title="이벤트" href="/my/events" />
            {data.events.length === 0 ? (
              <p className="empty">이벤트가 없어요.</p>
            ) : (
              data.events.map((e: any) => (
                <Link key={e.id} href={`/my/events/${e.id}`} className={`dog-card${e.has_image ? " with-thumb" : ""}`}>
                  <EventImage eventId={e.id} show={!!e.has_image} small />
                  <div className="event-text">
                    <div className="name">
                      {e.title} {e.ongoing && <span className="badge">진행 중</span>}
                    </div>
                    <div className="meta">
                      {formatDate(e.start_date)} ~ {formatDate(e.end_date)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </>
        )}
      </State>
    </>
  );
}

/* ---------- C3. 내 강아지 ---------- */

export function DogListView() {
  const { data, error, loading, reload } = useFetch<any[]>("/me/dogs");
  return (
    <>
      <Heading title="내 강아지" sub="정보를 고치거나 새 강아지를 추가할 수 있어요." />
      <Link href="/my/dogs/new" className="btn primary" style={{ width: "100%", marginBottom: 14 }}>
        + 강아지 추가
      </Link>
      <State loading={loading} error={error} empty={data?.length === 0} emptyText="등록된 강아지가 없어요." onRetry={reload}>
        {data?.map((d) => (
          <Link key={d.id} href={`/my/dogs/${d.id}`} className="dog-card">
            <div className="name">{d.name}</div>
            <div className="meta">
              {d.breed} · {d.gender} · {d.age}살 · {d.weight}kg
            </div>
            <div className="meta">최근 미용 {formatDate(d.last_groomed_at)}</div>
          </Link>
        ))}
      </State>
    </>
  );
}

/** 어울리는 스타일 추천 (고객은 추천 스타일과 이유만 볼 수 있어요) */
function StyleHelper({ dogId }: { dogId: number }) {
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
      <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>🤖 어울리는 스타일 추천</h2>
      {!result && !error && <p className="sub">우리 강아지의 지난 미용 기록을 보고 어울리는 스타일을 추천해 줘요.</p>}
      {error && <Alert kind="error">{error}</Alert>}
      {result && (
        <div style={{ margin: "8px 0" }}>
          <div>
            추천 스타일:{" "}
            {result.recommended_style ? <span className="badge">{result.recommended_style}</span> : "추천 없음"}
          </div>
          {result.reason && <p className="sub">{result.reason}</p>}
          <p className="ai-note">AI가 만든 참고용 안내예요. 매장과 상의해서 정해 주세요. (오늘 {result.remaining}번 더 볼 수 있어요)</p>
        </div>
      )}
      <button className="btn primary" onClick={ask} disabled={busy} style={{ width: "100%" }}>
        {busy ? "추천을 만드는 중... (몇 초 걸려요)" : result ? "다시 추천받기" : "스타일 추천받기"}
      </button>
    </section>
  );
}

export function DogDetailView({ id }: { id: number }) {
  const { data, error, loading, reload } = useFetch<any>(`/me/dogs/${id}`);
  return (
    <>
      <Heading title={data ? data.name : "내 강아지"} back="/my/dogs" />
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <section className="card">
              <div className="card-head">
                <h2>강아지 정보</h2>
                <Link href={`/my/dogs/${id}/edit`} className="btn small">
                  정보 수정
                </Link>
              </div>
              <dl className="info">
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

            <Link href={`/my/reserve?dog_id=${id}`} className="btn primary big" style={{ marginBottom: 16 }}>
              이 강아지로 예약하기
            </Link>

            <StyleHelper dogId={id} />

            <section className="card">
              <h2>주의사항</h2>
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
                    </li>
                  ))}
                </ul>
              )}
              <p className="sub">주의사항은 매장에서 적어 두고 있어요. 알려 주실 내용이 있으면 미용 때 말씀해 주세요.</p>
            </section>

            <section className="card">
              <h2>미용 이력</h2>
              {data.records.length === 0 ? (
                <p className="empty">미용 기록이 아직 없어요.</p>
              ) : (
                <ul className="list">
                  {data.records.map((r: any) => (
                    <li key={r.id}>
                      <div className="main">
                        <div className="title">
                          {formatDate(r.groomed_at)} · {r.style}
                        </div>
                        <div className="meta">
                          {r.groomer_name} 관리사 · {formatPrice(r.price)}
                          {r.memo ? ` · ${r.memo}` : ""}
                        </div>
                      </div>
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

/** C4. 강아지 추가·수정 (삭제는 없어요) */
export function DogFormView({ id }: { id?: number }) {
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(id ? `/me/dogs/${id}` : null);
  const [value, setValue] = useState<DogValue | null>(id ? null : { ...emptyDog });
  const { errors, message, busy, run } = useSubmit();

  // 수정 화면: 서버에서 받아 온 값으로 칸을 채워요. (한 번만)
  const form: DogValue | null =
    value ??
    (data
      ? {
          name: data.name ?? "",
          breed: data.breed ?? "",
          gender: data.gender ?? "",
          age: String(data.age ?? ""),
          weight: String(data.weight ?? ""),
          birthday: data.birthday ?? "",
          note: "",
        }
      : null);

  return (
    <>
      <Heading title={id ? "강아지 정보 수정" : "강아지 추가"} back={id ? `/my/dogs/${id}` : "/my/dogs"} sub="* 표시는 꼭 적어 주세요." />
      <State loading={!!id && loading} error={error} onRetry={reload}>
        {form && (
          <section className="card">
            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                await run(async () => {
                  const result = await api<{ id: number }>(id ? `/me/dogs/${id}` : "/me/dogs", {
                    method: id ? "PUT" : "POST",
                    body: form,
                  });
                  router.push(`/my/dogs/${result.id}`);
                });
              }}
            >
              <FormMessage message={message} errors={errors} />
              <DogFields value={form} onChange={setValue} errors={errors} />
              <button className="btn primary big" type="submit" disabled={busy}>
                {busy ? "저장 중..." : id ? "저장하기" : "추가하기"}
              </button>
            </form>
          </section>
        )}
      </State>
    </>
  );
}

/* ---------- C5. 예약 신청 ---------- */

export function ReserveView() {
  const router = useRouter();
  const search = useSearchParams();
  const options = useOptions();
  const dogs = useFetch<any[]>("/me/dogs");
  const groomers = useFetch<any[]>("/me/groomers");
  const [v, setV] = useState({
    dog_id: search.get("dog_id") ?? "",
    reserved_date: "",
    groomer: "auto",
    reserved_time: "",
    style: "",
    memo: "",
  });
  const { errors, message, busy, run } = useSubmit();

  // 처음 들어오면 등록된 첫 번째 강아지가 미리 골라져 있어요. (강아지 화면에서 들어오면 그 강아지)
  const dogId = v.dog_id || (dogs.data?.length ? String(dogs.data[0].id) : "");
  const availPath = v.reserved_date
    ? `/me/availability?date=${v.reserved_date}${v.groomer !== "auto" ? `&groomer_id=${v.groomer}` : ""}`
    : null;
  const av = useFetch<any>(availPath);
  const slots: any[] = v.reserved_date ? (av.data?.slots ?? []) : [];

  return (
    <>
      <Heading title="예약 신청" sub="신청하면 바로 확정돼요. * 표시는 꼭 골라 주세요." />
      <section className="card">
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            await run(async () => {
              const result = await api<{ id: number }>("/me/reservations", {
                method: "POST",
                body: {
                  dog_id: dogId,
                  groomer_id: v.groomer,
                  reserved_date: v.reserved_date,
                  reserved_time: v.reserved_time,
                  style: v.style,
                  memo: v.memo,
                },
              });
              router.push(`/my/reservations/${result.id}?new=1`);
            });
          }}
        >
          <FormMessage message={message} errors={errors} />

          <Field label="1. 강아지" required error={errors.dog_id}>
            <select value={dogId} onChange={(e) => setV({ ...v, dog_id: e.target.value })}>
              <option value="">선택해 주세요</option>
              {(dogs.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.breed})
                </option>
              ))}
            </select>
          </Field>

          <Field label="2. 날짜" required error={errors.reserved_date} hint="일요일과 공휴일은 쉬어요">
            <input
              type="date"
              value={v.reserved_date}
              min={todayString()}
              onChange={(e) => setV({ ...v, reserved_date: e.target.value, reserved_time: "" })}
            />
          </Field>

          <Field label="3. 관리사" hint="'자동'을 고르면 그 시간에 가장 한가한 관리사를 정해 드려요">
            <select value={v.groomer} onChange={(e) => setV({ ...v, groomer: e.target.value, reserved_time: "" })}>
              <option value="auto">자동으로 정해 주세요 (추천)</option>
              {(groomers.data ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} 관리사
                </option>
              ))}
            </select>
          </Field>

          <Field label="4. 시간" required error={errors.reserved_time} hint={v.reserved_date ? "눌러서 고를 수 있는 시간만 보여요" : "먼저 날짜를 골라 주세요"}>
            {av.data?.closed && v.reserved_date && <div className="board-closed">🚫 이 날은 쉬는 날이에요 ({av.data.closed}). 다른 날짜를 골라 주세요.</div>}
            <div className="slot-grid">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.time}
                  className={`time-chip${v.reserved_time === s.time ? " on" : ""}`}
                  disabled={!s.available}
                  onClick={() => setV({ ...v, reserved_time: s.time })}
                >
                  {s.time}
                </button>
              ))}
            </div>
            {v.reserved_date && !av.data?.closed && slots.length > 0 && !slots.some((s) => s.available) && (
              <p className="sub">이 날은 예약할 수 있는 시간이 없어요. 다른 날짜를 골라 주세요.</p>
            )}
          </Field>

          <Field label="5. 희망 스타일" required error={errors.style}>
            <select value={v.style} onChange={(e) => setV({ ...v, style: e.target.value })}>
              <option value="">선택해 주세요</option>
              {options?.styles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="6. 요청 메모" error={errors.memo}>
            <textarea value={v.memo} maxLength={300} onChange={(e) => setV({ ...v, memo: e.target.value })} placeholder="예: 발톱을 짧게 부탁드려요." />
          </Field>

          <button className="btn primary big" type="submit" disabled={busy}>
            {busy ? "신청 중..." : "예약 신청하기"}
          </button>
        </form>
      </section>
    </>
  );
}

/* ---------- C6. 내 예약 (메뉴 없이 화면으로만) ---------- */

export function MyReservationsView() {
  const { data, error, loading, reload } = useFetch<any>("/me/reservations");
  const [tab, setTab] = useState<"upcoming" | "past" | "canceled">("upcoming");
  const list: any[] = data?.[tab] ?? [];
  const label = { upcoming: "다가오는 예약", past: "지난 예약", canceled: "취소한 예약" };
  return (
    <>
      <Heading title="내 예약" back="/my" />
      <div className="seg">
        {(["upcoming", "past", "canceled"] as const).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {label[t]}
            {data ? ` ${data[t].length}` : ""}
          </button>
        ))}
      </div>
      <State loading={loading} error={error} empty={list.length === 0} emptyText={`${label[tab]}이 없어요.`} onRetry={reload}>
        {list.map((r) => (
          <ReservationCard key={r.id} r={r} showCancel={tab === "upcoming"} onChanged={reload} />
        ))}
      </State>
    </>
  );
}

export function MyReservationDetailView({ id }: { id: number }) {
  const search = useSearchParams();
  const router = useRouter();
  const { data, error, loading, reload } = useFetch<any>(`/me/reservations/${id}`);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!confirmDelete("이 예약을 취소할까요?\n취소한 예약은 되돌릴 수 없어요.")) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api<{ message: string }>(`/me/reservations/${id}/cancel`, { method: "POST" });
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
      <Heading title="예약 상세" back="/my/reservations" />
      {search.get("new") && !result && <Alert kind="ok">예약이 확정되었어요! 🎉 아래에서 내용을 확인해 주세요.</Alert>}
      {result && <Alert kind={result.kind}>{result.text}</Alert>}
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <section className="card">
              <dl className="info">
                <dt>상태</dt>
                <dd>
                  <span className={`badge ${data.status === "신청" ? "" : "gray"}`}>{data.status === "신청" ? "예약 확정" : "취소됨"}</span>
                </dd>
                <dt>강아지</dt>
                <dd>{data.dog_name}</dd>
                <dt>예약 일시</dt>
                <dd>
                  {niceDate(data.reserved_date)} {data.reserved_time}
                </dd>
                <dt>관리사</dt>
                <dd>{data.groomer_name}</dd>
                <dt>희망 스타일</dt>
                <dd>{data.style}</dd>
                <dt>요청 메모</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>{data.memo || "-"}</dd>
                {data.status === "취소" ? (
                  <>
                    <dt>취소 일시</dt>
                    <dd>{formatDateTime(data.canceled_at)}</dd>
                  </>
                ) : (
                  <>
                    <dt>취소 마감</dt>
                    <dd>{data.cancel_deadline} 까지 (예약 당일 00시 전까지 취소할 수 있어요)</dd>
                  </>
                )}
              </dl>
            </section>
            {data.status === "신청" &&
              (data.cancelable ? (
                <button className="btn danger big" onClick={cancel} disabled={busy}>
                  예약 취소하기
                </button>
              ) : (
                <Alert kind="error">예약 당일 00시가 지나서 취소할 수 없어요. 매장으로 전화해 주세요.</Alert>
              ))}
            <button className="btn big" style={{ marginTop: 10 }} onClick={() => router.push("/my")}>
              홈으로
            </button>
          </>
        )}
      </State>
    </>
  );
}

/* ---------- C7. 공지사항·이벤트 (메뉴 없이 홈에서 들어가요) ---------- */

export function NoticeListView() {
  const { items: data, total, error, loading, done, sentinel, loadMore } = useInfinite<any>("/notices");
  return (
    <>
      <Heading title="공지사항" back="/my" />
      <State loading={loading && data.length === 0} error={error} empty={data.length === 0 && !loading} emptyText="공지사항이 없어요." onRetry={loadMore}>
        <ListTotal total={total} />
        {data.map((n) => (
          <Link key={n.id} href={`/my/notices/${n.id}`} className="dog-card">
            <div className="name">
              {n.title} {n.file_count > 0 && <span className="badge">📎 {n.file_count}</span>}
            </div>
            <div className="meta">{formatDate(n.created_at)}</div>
          </Link>
        ))}
        <InfiniteFooter loading={loading} done={done} count={data.length} sentinel={sentinel} />
      </State>
    </>
  );
}

export function EventListView() {
  const { items: data, total, error, loading, done, sentinel, loadMore } = useInfinite<any>("/events");
  return (
    <>
      <Heading title="이벤트" back="/my" />
      <State loading={loading && data.length === 0} error={error} empty={data.length === 0 && !loading} emptyText="이벤트가 없어요." onRetry={loadMore}>
        <ListTotal total={total} />
        {data.map((e) => (
          <Link key={e.id} href={`/my/events/${e.id}`} className="dog-card">
            <div className="name">
              {e.title} {e.ongoing && <span className="badge">진행 중</span>} {e.has_image && <span className="badge">🖼</span>}
            </div>
            <div className="meta">
              {formatDate(e.start_date)} ~ {formatDate(e.end_date)}
            </div>
          </Link>
        ))}
        <InfiniteFooter loading={loading} done={done} count={data.length} sentinel={sentinel} />
      </State>
    </>
  );
}

export function BoardReadView({ kind, id }: { kind: "notices" | "events"; id: number }) {
  const { data, error, loading, reload } = useFetch<any>(`/${kind}/${id}`);
  return (
    <>
      <Heading title={kind === "notices" ? "공지사항" : "이벤트"} back={`/my/${kind}`} />
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <section className="card">
            <h2>{data.title}</h2>
            <p className="sub">
              {kind === "events" ? `${formatDate(data.start_date)} ~ ${formatDate(data.end_date)}` : formatDate(data.created_at)}
            </p>
            {kind === "events" && <EventImage eventId={id} show={!!data.has_image} />}
            <p style={{ whiteSpace: "pre-wrap" }}>{data.content}</p>
            {kind === "events" && <EventLink url={data.link_url} />}
            {kind === "notices" && <NoticeFiles noticeId={id} files={data.files} />}
          </section>
        )}
      </State>
    </>
  );
}

/* ---------- C8. 내 정보 ---------- */

function ProfileForm({ initial }: { initial: GuardianValue }) {
  const [value, setValue] = useState<GuardianValue>(initial);
  const [saved, setSaved] = useState(false);
  const { errors, message, busy, run } = useSubmit();
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setSaved(false);
        const ok = await run(async () => {
          await api("/me/profile", { method: "PUT", body: value });
        });
        if (ok) setSaved(true);
      }}
    >
      <FormMessage message={message} errors={errors} />
      {saved && <Alert kind="ok">내 정보를 저장했어요.</Alert>}
      <GuardianFields value={value} onChange={setValue} errors={errors} />
      <button className="btn primary big" type="submit" disabled={busy}>
        {busy ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [value, setValue] = useState({ current_password: "", new_password: "" });
  const [saved, setSaved] = useState(false);
  const { errors, message, busy, run } = useSubmit();
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setSaved(false);
        const ok = await run(async () => {
          await api("/me/password", { method: "PUT", body: value });
        });
        if (ok) {
          setSaved(true);
          setValue({ current_password: "", new_password: "" });
        }
      }}
    >
      <FormMessage message={message} errors={errors} />
      {saved && <Alert kind="ok">비밀번호를 바꿨어요.</Alert>}
      <Field label="지금 쓰는 비밀번호" required error={errors.current_password}>
        <input type="password" autoComplete="current-password" value={value.current_password} onChange={(e) => setValue({ ...value, current_password: e.target.value })} />
      </Field>
      <Field label="새 비밀번호" required error={errors.new_password} hint="8자 이상">
        <input type="password" autoComplete="new-password" value={value.new_password} onChange={(e) => setValue({ ...value, new_password: e.target.value })} />
      </Field>
      <button className="btn big" type="submit" disabled={busy}>
        {busy ? "바꾸는 중..." : "비밀번호 바꾸기"}
      </button>
    </form>
  );
}

export function ProfileView() {
  const { logout } = useAuth();
  const { data, error, loading, reload } = useFetch<any>("/me");
  const g = data?.guardian;
  return (
    <>
      <Heading title="내 정보" sub={data ? `아이디: ${data.user.username}` : undefined} />
      <State loading={loading} error={error} onRetry={reload}>
        {g && (
          <>
            <section className="card">
              <h2>보호자 정보</h2>
              <ProfileForm
                initial={{
                  name: g.name ?? "",
                  phone: g.phone ?? "",
                  email: g.email ?? "",
                  emergency_name: g.emergency_name ?? "",
                  emergency_phone: g.emergency_phone ?? "",
                  message: g.message ?? "",
                }}
              />
            </section>
            <section className="card">
              <h2>비밀번호 변경</h2>
              <PasswordForm />
            </section>
            <button className="btn big" onClick={logout}>
              로그아웃
            </button>
          </>
        )}
      </State>
    </>
  );
}
