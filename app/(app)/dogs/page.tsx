"use client";

import Link from "next/link";
import { useState } from "react";
import { usePaged } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ListTotal, PageHead, Pagination, SearchBar, State } from "@/components/ui";

export default function DogsPage() {
  const [q, setQ] = useState("");
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/dogs", `q=${encodeURIComponent(q)}`);
  return (
    <>
      <PageHead title="강아지 목록" sub="강아지 이름, 견종, 보호자 이름으로 찾을 수 있어요.">
        <Link href="/register" className="btn primary">
          + 신규 등록하기
        </Link>
      </PageHead>
      <SearchBar placeholder="강아지 이름 · 견종 · 보호자 이름 검색" onSearch={setQ} />
      <section className="card">
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="찾은 강아지가 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <ul className="list">
            {data?.map((d) => (
              <li key={d.id}>
                <Link href={`/dogs/${d.id}`} className="row">
                  <div className="title">
                    {d.name} <span className="badge">{d.breed}</span>
                  </div>
                  <div className="meta">
                    {d.gender} · {d.age}살 · {d.weight}kg · 보호자 {d.guardian_name} ({d.guardian_phone})
                  </div>
                </Link>
                <div className="meta">최근 미용 {formatDate(d.last_groomed_at)}</div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </State>
      </section>
    </>
  );
}
