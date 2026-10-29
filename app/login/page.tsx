"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import Link from "next/link";
import { homeFor, useAuth } from "@/lib/auth";
import { Alert, Field } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, checking, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(
    search.get("expired") ? "로그인 시간이 끝났어요. 다시 로그인해 주세요." : null,
  );
  const [busy, setBusy] = useState(false);

  // 이미 로그인되어 있으면 홈으로 보내요.
  useEffect(() => {
    if (!checking && user) router.replace(homeFor(user));
  }, [checking, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      const me = await login(username, password);
      router.replace(homeFor(me));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        setMessage(err.message);
      } else {
        setMessage("문제가 생겼어요. 잠시 뒤 다시 해 주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo" aria-hidden />
          <h1>몽실 미용실</h1>
        </div>
        <p className="sub">예약·고객 관리 · 로그인해서 이용해 주세요</p>
        {message && <Alert kind="error">{message}</Alert>}
        <form onSubmit={submit} noValidate>
          <Field label="아이디" error={errors.username}>
            <input
              value={username}
              autoComplete="username"
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 적어 주세요"
            />
          </Field>
          <Field label="비밀번호" error={errors.password}>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 적어 주세요"
            />
          </Field>
          <button className="btn primary big" style={{ width: "100%" }} type="submit" disabled={busy}>
            {busy ? "확인 중..." : "로그인"}
          </button>
        </form>
        <p className="login-help">처음이신가요? <Link href="/signup" className="link">회원가입</Link> 하고 바로 예약해 보세요.</p>
        <p className="login-help">관리사 계정은 사장님이 만들어 드려요. 비밀번호를 잊으면 매장에 말씀해 주세요.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
