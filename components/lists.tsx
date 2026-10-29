"use client";

import Link from "next/link";
import { useState } from "react";
import { api, useFetch, usePaged } from "@/lib/api";
import { formatDate, formatPrice, todayString } from "@/lib/format";
import { EventForm, GroomerForm, NoticeForm } from "./forms";
import { EventImage, EventLink, NoticeFiles } from "./board-extras";
import { Alert, confirmDelete, ListTotal, PageHead, Pagination, SearchBar, State } from "./ui";

/* ---------- 미용기록 목록 (관리사/관리 공용) ---------- */

export function RecordsView({ admin }: { admin?: boolean }) {
  const base = "/records";
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/records", params.toString());

  async function remove(id: number, label: string) {
    if (!confirmDelete(`"${label}" 미용 기록을 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return;
    setProblem(null);
    try {
      await api(`/records/${id}`, { method: "DELETE" });
      setNotice("삭제했어요.");
      reload();
    } catch (e: any) {
      setProblem(e.message);
    }
  }

  return (
    <>
      <PageHead title="미용 기록" sub="강아지 이름, 담당 관리사, 스타일로 찾을 수 있어요.">
        <Link href={`${base}/new`} className={`btn ${admin ? "admin" : "primary"}`}>
          + 미용 기록 등록
        </Link>
      </PageHead>
      {notice && <Alert kind="ok">{notice}</Alert>}
      {problem && <Alert kind="error">{problem}</Alert>}
      <SearchBar placeholder="강아지 이름 · 담당 관리사 · 스타일 검색" onSearch={setQ} />
      <div className="filters">
        <div className="field">
          <label>시작 날짜</label>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>끝 날짜</label>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <button
            className="btn"
            style={{ alignSelf: "flex-end", marginBottom: 14 }}
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            날짜 지우기
          </button>
        )}
      </div>
      <section className="card">
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="찾은 미용 기록이 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>강아지</th>
                  <th>스타일</th>
                  <th>담당</th>
                  <th>가격</th>
                  <th>사진</th>
                  {admin && <th>관리</th>}
                </tr>
              </thead>
              <tbody>
                {data?.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.groomed_at)}</td>
                    <td>
                      <Link className="title-link" href={`${base}/${r.id}`}>
                        {r.dog_name}
                      </Link>
                    </td>
                    <td>{r.style}</td>
                    <td>{r.groomer_name}</td>
                    <td>{formatPrice(r.price)}</td>
                    <td>{r.has_photo ? "있음" : "-"}</td>
                    {admin && (
                      <td>
                        <div className="actions">
                          <Link className="btn small" href={`/records/${r.id}/edit`}>
                            수정
                          </Link>
                          <button className="btn small danger" onClick={() => remove(r.id, `${r.dog_name} ${formatDate(r.groomed_at)}`)}>
                            삭제
                          </button>
                        </div>
                      </td>
                    )}
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

/* ---------- 공지사항 (관리사: 읽기 / 관리: 등록·수정·삭제) ---------- */

export function NoticesView({ admin }: { admin?: boolean }) {
  const [q, setQ] = useState("");
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/notices", `q=${encodeURIComponent(q)}`);
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function remove(n: any) {
    if (!confirmDelete(`"${n.title}" 공지사항을 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return;
    try {
      await api(`/notices/${n.id}`, { method: "DELETE" });
      setMessage({ kind: "ok", text: "삭제했어요." });
      reload();
    } catch (e: any) {
      setMessage({ kind: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHead title="공지사항" sub={admin ? "등록하고 고치고 지울 수 있어요." : "미용실 소식을 확인하세요."}>
        {admin && editing === null && (
          <button className="btn admin" onClick={() => setEditing("new")}>
            + 공지 등록
          </button>
        )}
      </PageHead>
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      {admin && editing === "new" && (
        <section className="card">
          <h2>새 공지사항</h2>
          <NoticeForm
            initial={{ title: "", content: "" }}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              setMessage({ kind: "ok", text: "등록했어요." });
              reload();
            }}
          />
        </section>
      )}
      <SearchBar placeholder="제목으로 검색" onSearch={setQ} />
      <section className="card">
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="공지사항이 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <ul className="list">
            {data?.map((n) =>
              editing === n.id ? (
                <li key={n.id} style={{ display: "block" }}>
                  <NoticeForm
                    id={n.id}
                    initial={{ title: n.title, content: n.content }}
                    onCancel={() => setEditing(null)}
                    onDone={() => {
                      setEditing(null);
                      setMessage({ kind: "ok", text: "수정했어요." });
                      reload();
                    }}
                  />
                </li>
              ) : (
                <li key={n.id}>
                  {admin ? (
                    <div className="main">
                      <div className="title">
                        <Link className="title-link" href={`/notices/${n.id}`}>
                          {n.title}
                        </Link>{" "}
                        {n.file_count > 0 && <span className="badge gray">📎 {n.file_count}</span>}
                      </div>
                      <div className="meta">{formatDate(n.created_at)}</div>
                      <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{n.content}</div>
                    </div>
                  ) : (
                    <Link href={`/notices/${n.id}`} className="row">
                      <div className="title">
                        {n.title} {n.file_count > 0 && <span className="badge gray">📎 {n.file_count}</span>}
                      </div>
                      <div className="meta">{formatDate(n.created_at)}</div>
                    </Link>
                  )}
                  {admin && (
                    <div className="actions">
                      <button className="btn small" onClick={() => setEditing(n.id)}>
                        수정
                      </button>
                      <button className="btn small danger" onClick={() => remove(n)}>
                        삭제
                      </button>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </State>
      </section>
    </>
  );
}

/* ---------- 이벤트 ---------- */

export function EventsView({ admin }: { admin?: boolean }) {
  const [q, setQ] = useState("");
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/events", `q=${encodeURIComponent(q)}`);
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function remove(ev: any) {
    if (!confirmDelete(`"${ev.title}" 이벤트를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return;
    try {
      await api(`/events/${ev.id}`, { method: "DELETE" });
      setMessage({ kind: "ok", text: "삭제했어요." });
      reload();
    } catch (e: any) {
      setMessage({ kind: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHead title="이벤트" sub={admin ? "등록하고 고치고 지울 수 있어요." : "진행 중인 이벤트를 확인하세요."}>
        {admin && editing === null && (
          <button className="btn admin" onClick={() => setEditing("new")}>
            + 이벤트 등록
          </button>
        )}
      </PageHead>
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      {admin && editing === "new" && (
        <section className="card">
          <h2>새 이벤트</h2>
          <EventForm
            initial={{ title: "", content: "", start_date: todayString(), end_date: "" }}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              setMessage({ kind: "ok", text: "등록했어요." });
              reload();
            }}
          />
        </section>
      )}
      <SearchBar placeholder="제목으로 검색" onSearch={setQ} />
      <section className="card">
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="이벤트가 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <ul className="list">
            {data?.map((ev) =>
              editing === ev.id ? (
                <li key={ev.id} style={{ display: "block" }}>
                  <EventForm
                    id={ev.id}
                    initial={{ title: ev.title, content: ev.content, start_date: ev.start_date, end_date: ev.end_date, link_url: ev.link_url }}
                    onCancel={() => setEditing(null)}
                    onDone={() => {
                      setEditing(null);
                      setMessage({ kind: "ok", text: "수정했어요." });
                      reload();
                    }}
                  />
                </li>
              ) : (
                <li key={ev.id}>
                  {admin ? (
                    <div className="main">
                      <div className="title">
                        <Link className="title-link" href={`/events/${ev.id}`}>
                          {ev.title}
                        </Link>{" "}
                        {ev.ongoing && <span className="badge green">진행 중</span>}
                      </div>
                      <div className="meta">
                        {formatDate(ev.start_date)} ~ {formatDate(ev.end_date)}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{ev.content}</div>
                      <EventImage eventId={ev.id} show={!!ev.has_image} small />
                    </div>
                  ) : (
                    <Link href={`/events/${ev.id}`} className="row">
                      <div className="title">
                        {ev.title} {ev.ongoing && <span className="badge green">진행 중</span>} {ev.has_image && <span className="badge gray">🖼</span>}
                      </div>
                      <div className="meta">
                        {formatDate(ev.start_date)} ~ {formatDate(ev.end_date)}
                      </div>
                    </Link>
                  )}
                  {admin && (
                    <div className="actions">
                      <button className="btn small" onClick={() => setEditing(ev.id)}>
                        수정
                      </button>
                      <button className="btn small danger" onClick={() => remove(ev)}>
                        삭제
                      </button>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </State>
      </section>
    </>
  );
}

/* ---------- 관리사 (관리 화면) ---------- */

export function GroomersView() {
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useFetch<any[]>(`/groomers?q=${encodeURIComponent(q)}`);
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function remove(g: any) {
    if (!confirmDelete(`"${g.name}" 관리사를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return;
    try {
      await api(`/groomers/${g.id}`, { method: "DELETE" });
      setMessage({ kind: "ok", text: "삭제했어요." });
      reload();
    } catch (e: any) {
      setMessage({ kind: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHead title="관리사 목록" sub="미용을 맡는 관리사예요. 미용기록이 있는 관리사는 '퇴사'로 바꿔 주세요.">
        {editing === null && (
          <button className="btn admin" onClick={() => setEditing("new")}>
            + 관리사 등록
          </button>
        )}
      </PageHead>
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      {editing === "new" && (
        <section className="card">
          <h2>새 관리사</h2>
          <GroomerForm
            initial={{ name: "", phone: "", status: "근무중" }}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              setMessage({ kind: "ok", text: "등록했어요." });
              reload();
            }}
          />
        </section>
      )}
      <SearchBar placeholder="이름으로 검색" onSearch={setQ} />
      <section className="card">
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="찾은 관리사가 없어요." onRetry={reload}>
          <ul className="list">
            {data?.map((g) =>
              editing === g.id ? (
                <li key={g.id} style={{ display: "block" }}>
                  <GroomerForm
                    id={g.id}
                    initial={{ name: g.name, phone: g.phone ?? "", status: g.status }}
                    onCancel={() => setEditing(null)}
                    onDone={() => {
                      setEditing(null);
                      setMessage({ kind: "ok", text: "수정했어요." });
                      reload();
                    }}
                  />
                </li>
              ) : (
                <li key={g.id}>
                  <div className="main">
                    <div className="title">
                      {g.name} <span className={`badge ${g.status === "근무중" ? "green" : "gray"}`}>{g.status}</span>
                    </div>
                    <div className="meta">
                      {g.phone ?? "번호 없음"} · 미용기록 {g.record_count}건
                    </div>
                  </div>
                  <div className="actions">
                    <button className="btn small" onClick={() => setEditing(g.id)}>
                      수정
                    </button>
                    <button className="btn small danger" onClick={() => remove(g)}>
                      삭제
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </State>
      </section>
    </>
  );
}

/* ---------- 공지사항·이벤트 상세 (관리자 화면, 읽기 전용) ---------- */

export function BoardDetail({ kind, id }: { kind: "notices" | "events"; id: number }) {
  const { data, error, loading, reload } = useFetch<any>(`/${kind}/${id}`);
  const back = `/${kind}`;
  return (
    <>
      <PageHead title={kind === "notices" ? "공지사항" : "이벤트"}>
        <Link href={back} className="btn">
          ← 목록으로
        </Link>
      </PageHead>
      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <section className="card">
            <h2>
              {data.title} {data.ongoing && <span className="badge green">진행 중</span>}
            </h2>
            <p className="meta" style={{ color: "var(--muted)" }}>
              {kind === "events"
                ? `${formatDate(data.start_date)} ~ ${formatDate(data.end_date)}`
                : formatDate(data.created_at)}
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

