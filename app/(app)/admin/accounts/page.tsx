"use client";

import { useState } from "react";
import Link from "next/link";
import { api, usePaged } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Alert, confirmDelete, ListTotal, PageHead, Pagination, State } from "@/components/ui";

/**
 * 고객 계정: 고객이 직접 가입하면 여기에 나타나요. 사장님은 보거나 지울 수 있어요.
 * (관리사 로그인 계정은 "관리사 관리" 화면에서 관리사와 함께 만들고 관리해요.)
 */
export default function CustomerAccountsPage() {
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/users", `role=${encodeURIComponent("고객")}`);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const customers = data ?? [];

  async function remove(u: any) {
    if (!confirmDelete(`"${u.name}" 고객 계정을 지울까요?\n지우면 이 계정으로 로그인할 수 없어요.\n(고객의 보호자·강아지 정보는 그대로 남아요)`)) return;
    try {
      await api(`/users/${u.id}`, { method: "DELETE" });
      setResult({ kind: "ok", text: "삭제했어요." });
      reload();
    } catch (e: any) {
      setResult({ kind: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHead title="회원 관리" sub="고객이 직접 가입하면 여기에 나타나요. 관리사 로그인 계정은 '관리사 관리' 화면에서 만들어요.">
        <Link href="/admin/groomers" className="btn">
          관리사 관리 화면으로
        </Link>
      </PageHead>
      {result && <Alert kind={result.kind}>{result.text}</Alert>}
      <section className="card">
        <State loading={loading} error={error} empty={customers.length === 0} emptyText="가입한 고객이 아직 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>아이디</th>
                  <th>이름</th>
                  <th>보호자 번호</th>
                  <th>가입일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link className="title-link" href={`/admin/accounts/${u.id}`}>
                        {u.username}
                      </Link>
                    </td>
                    <td>{u.name}</td>
                    <td>{u.guardian_phone ?? "-"}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <button className="btn small danger" onClick={() => remove(u)}>
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
