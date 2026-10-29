"use client";

import Link from "next/link";
import { useState } from "react";
import { api, usePaged } from "@/lib/api";
import { formatPhoneInput } from "@/lib/format";
import { FormMessage, useOptions, useSubmit } from "./forms";
import { Alert, confirmDelete, Field, ListTotal, PageHead, Pagination, SearchBar, State } from "./ui";

interface StaffValue {
  name: string;
  phone: string;
  status: string;
}

/**
 * 관리사 등록·수정. 같은 사람을 한 번만 등록해요.
 * - 등록할 때 "로그인 계정도 함께 만들기"를 고르면 아이디·비밀번호로 일반관리자 계정이 같이 만들어져요.
 * - 계정이 이미 있으면 아이디는 그대로 두고, 비밀번호만 새로 정할 수 있어요.
 */
export function StaffForm({
  id,
  initial,
  accountUsername,
  onDone,
  onCancel,
}: {
  id?: number;
  initial: StaffValue;
  /** 이미 계정이 있으면 그 아이디 */
  accountUsername?: string | null;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const options = useOptions();
  const hasAccount = !!accountUsername;
  const [value, setValue] = useState<StaffValue>(initial);
  const [withAccount, setWithAccount] = useState(!id); // 새로 등록할 때는 기본으로 계정도 같이 만들어요
  const [account, setAccount] = useState({ username: "", password: "", password2: "" });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { errors, message, busy, run } = useSubmit();
  const all = { ...errors, ...localErrors };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // 계정을 새로 만들거나 비밀번호를 새로 정할 때는 비밀번호를 한 번 더 확인해요.
    const typingPassword = hasAccount ? account.password !== "" : withAccount;
    if (typingPassword && account.password !== account.password2) {
      setLocalErrors({ "account.password2": "비밀번호가 서로 달라요. 같은 비밀번호를 한 번 더 적어 주세요." });
      return;
    }
    setLocalErrors({});
    const body: Record<string, unknown> = { ...value };
    if (hasAccount) {
      if (account.password) body.account = { password: account.password };
    } else if (withAccount) {
      body.account = { username: account.username, password: account.password };
    }
    await run(async () => {
      const result = await api<{ account_created?: boolean; password_changed?: boolean }>(id ? `/groomers/${id}` : "/groomers", {
        method: id ? "PUT" : "POST",
        body,
      });
      const extra = result.account_created ? " 로그인 계정도 만들었어요." : result.password_changed ? " 비밀번호도 새로 정했어요." : "";
      onDone(`${id ? "수정했어요." : "등록했어요."}${extra}`);
    });
  }

  return (
    <form noValidate onSubmit={submit}>
      <FormMessage message={message || (Object.keys(localErrors).length ? "입력한 내용을 다시 확인해 주세요." : null)} errors={all} />
      <div className="form-grid">
        <Field label="이름" required error={all.name}>
          <input value={value.name} maxLength={20} onChange={(e) => setValue({ ...value, name: e.target.value })} />
        </Field>
        <Field label="휴대폰 번호" required error={all.phone} hint="숫자 11자리">
          <input
            value={value.phone}
            inputMode="numeric"
            onChange={(e) => setValue({ ...value, phone: formatPhoneInput(e.target.value) })}
            placeholder="010-1234-5678"
          />
        </Field>
        <Field label="근무 상태" required error={all.status} hint="퇴사로 바꾸면 이 관리사는 로그인할 수 없어요">
          <select value={value.status} onChange={(e) => setValue({ ...value, status: e.target.value })}>
            {options?.groomerStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="dog-block">
        <h3>로그인 계정 (일반관리자)</h3>
        {hasAccount ? (
          <>
            <p className="sub" style={{ marginTop: 0 }}>
              이미 계정이 있어요. 아이디: <b>{accountUsername}</b> (아이디는 바꿀 수 없어요)
            </p>
            <div className="form-grid">
              <Field label="새 비밀번호" error={all["account.password"]} hint="바꿀 때만 적어 주세요 (8자 이상)">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={account.password}
                  onChange={(e) => setAccount({ ...account, password: e.target.value })}
                />
              </Field>
              <Field label="새 비밀번호 한 번 더" error={all["account.password2"]}>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={account.password2}
                  onChange={(e) => setAccount({ ...account, password2: e.target.value })}
                />
              </Field>
            </div>
          </>
        ) : (
          <>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700, marginBottom: 10 }}>
              <input
                type="checkbox"
                style={{ width: "auto", minHeight: 0 }}
                checked={withAccount}
                onChange={(e) => setWithAccount(e.target.checked)}
              />
              로그인 계정도 함께 만들기
            </label>
            {withAccount ? (
              <div className="form-grid">
                <Field label="아이디" required error={all["account.username"]} hint="영문·숫자 4~20자">
                  <input
                    value={account.username}
                    autoComplete="off"
                    maxLength={20}
                    onChange={(e) => setAccount({ ...account, username: e.target.value })}
                  />
                </Field>
                <div />
                <Field label="비밀번호" required error={all["account.password"]} hint="8자 이상">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={account.password}
                    onChange={(e) => setAccount({ ...account, password: e.target.value })}
                  />
                </Field>
                <Field label="비밀번호 한 번 더" required error={all["account.password2"]}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={account.password2}
                    onChange={(e) => setAccount({ ...account, password2: e.target.value })}
                  />
                </Field>
              </div>
            ) : (
              <p className="sub" style={{ margin: 0 }}>
                계정 없이 등록하면 예약에는 나오지만 이 관리사는 로그인할 수 없어요. 나중에 수정해서 계정을 만들 수 있어요.
              </p>
            )}
          </>
        )}
      </div>

      <div className="form-actions">
        <button className="btn admin" type="submit" disabled={busy}>
          {busy ? "저장 중..." : "저장하기"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}

/** 관리사 화면: 목록·검색·등록(+로그인 계정)·수정·삭제 (총관리자 전용) */
export function StaffView() {
  const [q, setQ] = useState("");
  const { data, total, page, pages, setPage, error, loading, reload } = usePaged<any>("/groomers", `q=${encodeURIComponent(q)}`);
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function remove(g: any) {
    if (
      !confirmDelete(
        `"${g.name}" 관리사를 삭제할까요?${g.account_username ? "\n로그인 계정도 함께 삭제돼요." : ""}\n삭제하면 되돌릴 수 없어요.`,
      )
    )
      return;
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
      <PageHead title="관리사 관리" sub="관리사 한 사람을 한 번만 등록해요. 등록할 때 로그인 계정도 함께 만들 수 있어요.">
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
          <StaffForm
            initial={{ name: "", phone: "", status: "근무중" }}
            onCancel={() => setEditing(null)}
            onDone={(text) => {
              setEditing(null);
              setMessage({ kind: "ok", text });
              reload();
            }}
          />
        </section>
      )}
      <SearchBar placeholder="이름으로 검색" onSearch={setQ} />
      <section className="card">
        <State loading={loading} error={error} empty={data?.length === 0} emptyText="찾은 관리사가 없어요." onRetry={reload}>
          <ListTotal total={total} />
          <ul className="list">
            {data?.map((g) =>
              editing === g.id ? (
                <li key={g.id} style={{ display: "block" }}>
                  <StaffForm
                    id={g.id}
                    initial={{ name: g.name, phone: g.phone ?? "", status: g.status }}
                    accountUsername={g.account_username}
                    onCancel={() => setEditing(null)}
                    onDone={(text) => {
                      setEditing(null);
                      setMessage({ kind: "ok", text });
                      reload();
                    }}
                  />
                </li>
              ) : (
                <li key={g.id}>
                  <div className="main">
                    <div className="title">
                      <Link className="title-link" href={`/admin/groomers/${g.id}`}>
                        {g.name}
                      </Link>{" "}
                      <span className={`badge ${g.status === "근무중" ? "green" : "gray"}`}>{g.status}</span>{" "}
                      {g.account_username ? (
                        <span className="badge admin">로그인 {g.account_username}</span>
                      ) : (
                        <span className="badge gray">로그인 계정 없음</span>
                      )}
                    </div>
                    <div className="meta">
                      {g.phone ?? "번호 없음"} · 미용기록 {g.record_count}건 · 예약 {g.reservation_count}건
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
          <Pagination page={page} pages={pages} onChange={setPage} />
        </State>
      </section>
    </>
  );
}
