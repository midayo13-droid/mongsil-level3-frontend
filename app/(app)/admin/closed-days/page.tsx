"use client";

import { useState } from "react";
import { api, usePaged } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { FormMessage, useSubmit } from "@/components/forms";
import { Alert, confirmDelete, Field, ListTotal, PageHead, Pagination, State } from "@/components/ui";

export default function ClosedDaysPage() {
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/closed-days");
  const [value, setValue] = useState({ closed_date: "", name: "" });
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { errors, message, busy, run } = useSubmit();

  async function remove(d: any) {
    if (!confirmDelete(`${formatDate(d.closed_date)} "${d.name}" 휴무일을 지울까요?\n지우면 그날 예약을 받을 수 있어요.`)) return;
    try {
      await api(`/closed-days/${d.id}`, { method: "DELETE" });
      setResult({ kind: "ok", text: "삭제했어요." });
      reload();
    } catch (e: any) {
      setResult({ kind: "error", text: e.message });
    }
  }

  async function sync() {
    setSyncing(true);
    setResult(null);
    try {
      const r = await api<{ message: string }>("/closed-days/sync", { method: "POST" });
      setResult({ kind: "ok", text: r.message });
      reload();
    } catch (e: any) {
      setResult({ kind: "error", text: e.message });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <PageHead title="휴무일 관리" sub="일요일은 항상 쉬어요. 공휴일은 무료 공휴일 API에서 자동으로 불러오고, 그 밖의 쉬는 날은 직접 추가해요.">
        <button className="btn" onClick={sync} disabled={syncing}>
          {syncing ? "불러오는 중..." : "공휴일 다시 불러오기"}
        </button>
      </PageHead>
      {result && <Alert kind={result.kind}>{result.text}</Alert>}

      <section className="card">
        <h2>휴무일 추가</h2>
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run(async () => {
              await api("/closed-days", { method: "POST", body: value });
            });
            if (ok) {
              setValue({ closed_date: "", name: "" });
              setResult({ kind: "ok", text: "휴무일을 추가했어요." });
              reload();
            }
          }}
        >
          <FormMessage message={message} errors={errors} />
          <div className="form-grid">
            <Field label="날짜" required error={errors.closed_date}>
              <input type="date" value={value.closed_date} onChange={(e) => setValue({ ...value, closed_date: e.target.value })} />
            </Field>
            <Field label="이름" required error={errors.name} hint="예: 임시공휴일, 매장 정기 휴무">
              <input value={value.name} maxLength={30} onChange={(e) => setValue({ ...value, name: e.target.value })} />
            </Field>
          </div>
          <button className="btn admin" type="submit" disabled={busy}>
            {busy ? "저장 중..." : "추가하기"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>등록된 휴무일</h2>
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="등록된 휴무일이 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>이름</th>
                  <th>출처</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((d) => (
                  <tr key={d.id}>
                    <td>{formatDate(d.closed_date)}</td>
                    <td>{d.name}</td>
                    <td>
                      <span className={`badge ${d.source === "공휴일" ? "green" : "admin"}`}>{d.source === "공휴일" ? "공휴일 API" : "직접 등록"}</span>
                    </td>
                    <td>
                      <button className="btn small danger" onClick={() => remove(d)}>
                        삭제
                      </button>
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
