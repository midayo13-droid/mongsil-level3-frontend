"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function PageHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}

/** 메인 화면의 목록 상자. "전체 보기" 바로가기가 붙어요. */
export function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-head section-head">
        <h2>{title}</h2>
        {href && (
          <Link href={href} className="link">
            전체 보기 ›
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** 불러오는 중 / 오류 / 비어 있음 을 한곳에서 보여 줘요. */
export function State({
  loading,
  error,
  empty,
  emptyText = "내용이 아직 없어요.",
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading && !error) return <p className="empty">불러오는 중이에요...</p>;
  if (error)
    return (
      <div className="alert error">
        {error}{" "}
        {onRetry && (
          <button className="btn small" onClick={onRetry} type="button">
            다시 불러오기
          </button>
        )}
      </div>
    );
  if (empty) return <p className="empty">{emptyText}</p>;
  return <>{children}</>;
}

/** 검색칸: 입력을 멈추면 잠깐 뒤에 자동으로 찾아요. */
export function SearchBar({
  placeholder,
  onSearch,
}: {
  placeholder: string;
  onSearch: (q: string) => void;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => onSearch(text.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <form
      className="searchbar"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(text.trim());
      }}
    >
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label="검색"
      />
      {text && (
        <button type="button" className="btn" onClick={() => setText("")}>
          지우기
        </button>
      )}
    </form>
  );
}

/** 칸 하나: 이름표 + 입력 + 쉬운 말 안내 */
export function Field({
  label,
  required,
  error,
  hint,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`field${error ? " has-error" : ""}${full ? " full" : ""}`}>
      <label>
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error-text">⚠ {error}</div>}
    </div>
  );
}

export function Alert({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  return <div className={`alert ${kind}`}>{children}</div>;
}

/** 삭제 전에 알럿창으로 한 번 더 물어봐요. */
export function confirmDelete(message: string) {
  return window.confirm(message);
}

/** 목록 위쪽의 "총 N건" */
export function ListTotal({ total }: { total: number }) {
  return (
    <div className="list-total">
      총 <b>{total.toLocaleString("ko-KR")}</b>건
    </div>
  );
}

/** 관리자 목록 아래쪽 쪽 번호: « ‹ 1 2 3 4 5 › » (쪽이 하나뿐이면 보이지 않아요) */
export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  const go = (p: number) => {
    onChange(Math.min(pages, Math.max(1, p)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <nav className="pager" aria-label="쪽 이동">
      <button type="button" onClick={() => go(1)} disabled={page === 1} aria-label="첫 쪽">
        «
      </button>
      <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="이전 쪽">
        ‹
      </button>
      {nums.map((n) => (
        <button key={n} type="button" className={n === page ? "on" : ""} onClick={() => go(n)} aria-current={n === page ? "page" : undefined}>
          {n}
        </button>
      ))}
      <button type="button" onClick={() => go(page + 1)} disabled={page === pages} aria-label="다음 쪽">
        ›
      </button>
      <button type="button" onClick={() => go(pages)} disabled={page === pages} aria-label="마지막 쪽">
        »
      </button>
    </nav>
  );
}

/** 고객 목록 맨 아래: 불러오는 중에는 로딩바, 끝까지 불러왔으면 안내 문구 */
export function InfiniteFooter({ loading, done, count, sentinel }: { loading: boolean; done: boolean; count: number; sentinel: (n: HTMLElement | null) => void }) {
  return (
    <div ref={sentinel} className="infinite-foot">
      {loading && count > 0 && (
        <div className="loadbar" role="status" aria-label="불러오는 중">
          <span />
        </div>
      )}
      {done && count > 0 && <p className="infinite-end">모두 불러왔어요.</p>}
    </div>
  );
}
