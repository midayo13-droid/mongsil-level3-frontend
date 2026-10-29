"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DogFields, emptyDog, FormMessage, GuardianFields, emptyGuardian, useSubmit, type DogValue, type GuardianValue } from "@/components/forms";
import { Field } from "@/components/ui";
import { homeFor, useAuth } from "@/lib/auth";

/** C1. 고객 가입: 계정 + 보호자 정보 + 강아지를 한 화면에서 순서대로 입력해요. (같은 번호가 이미 있으면 가입할 수 없어요) */
export default function SignupPage() {
  const router = useRouter();
  const { user, checking, signup } = useAuth();
  const [account, setAccount] = useState({ username: "", password: "", password2: "" });
  const [guardian, setGuardian] = useState<GuardianValue>({ ...emptyGuardian });
  const [dogs, setDogs] = useState<DogValue[]>([{ ...emptyDog }]);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { errors, message, busy, run } = useSubmit();
  // 값이 바뀔 때만 새로 만들어요. (매번 새로 만들면 입력할 때마다 틀린 첫 칸으로 커서가 옮겨 가요)
  const all = useMemo(() => ({ ...errors, ...localErrors }), [errors, localErrors]);

  // 이미 로그인되어 있으면 가입 화면 대신 첫 화면으로 보내요.
  useEffect(() => {
    if (!checking && user) router.replace(homeFor(user));
  }, [checking, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (account.password !== account.password2) {
      setLocalErrors({ "account.password2": "비밀번호가 서로 달라요. 같은 비밀번호를 한 번 더 적어 주세요." });
      return;
    }
    setLocalErrors({});
    await run(async () => {
      const me = await signup({
        account: { username: account.username, password: account.password },
        guardian,
        dogs,
      });
      router.replace(homeFor(me));
    });
  }

  return (
    <div className="cust">
      <div className="cust-wrap">
        <header className="cust-top">
          <span className="cust-logo">
            <span className="paw" aria-hidden />
            몽실 미용실
          </span>
          <Link href="/login" className="link" style={{ fontSize: 14 }}>
            로그인
          </Link>
        </header>
        <main className="cust-main" style={{ paddingBottom: 40 }}>
          <h1>회원가입</h1>
          <p className="sub">한 번만 입력하면 바로 예약할 수 있어요. * 표시는 꼭 적어 주세요.</p>
          <form onSubmit={submit} noValidate>
            <FormMessage message={message || (Object.keys(localErrors).length ? "입력한 내용을 다시 확인해 주세요." : null)} errors={all} />

            <section className="card">
              <h2>1. 로그인 정보</h2>
              <Field label="아이디" required error={all["account.username"]} hint="영문·숫자 4~20자">
                <input
                  value={account.username}
                  autoComplete="username"
                  maxLength={20}
                  onChange={(e) => setAccount({ ...account, username: e.target.value })}
                />
              </Field>
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
            </section>

            <section className="card">
              <h2>2. 보호자 정보</h2>
              <GuardianFields value={guardian} onChange={setGuardian} errors={all} prefix="guardian." />
            </section>

            <section className="card">
              <h2>3. 강아지 정보</h2>
              {all["dogs"] && <div className="error-text" style={{ marginBottom: 8 }}>⚠ {all["dogs"]}</div>}
              {dogs.map((dog, index) => (
                <div className="dog-block" key={index}>
                  <div className="card-head">
                    <h3>강아지 {index + 1}</h3>
                    {dogs.length > 1 && (
                      <button type="button" className="btn small" onClick={() => setDogs(dogs.filter((_, i) => i !== index))}>
                        빼기
                      </button>
                    )}
                  </div>
                  <DogFields
                    value={dog}
                    onChange={(v) => setDogs(dogs.map((d, i) => (i === index ? v : d)))}
                    errors={all}
                    prefix={`dogs.${index}.`}
                  />
                </div>
              ))}
              {dogs.length < 5 && (
                <button type="button" className="btn" onClick={() => setDogs([...dogs, { ...emptyDog }])}>
                  + 강아지 한 마리 더
                </button>
              )}
            </section>

            <button className="btn primary big" type="submit" disabled={busy}>
              {busy ? "가입하는 중..." : "가입하고 시작하기"}
            </button>
            <p className="sub" style={{ textAlign: "center", marginTop: 12 }}>
              이미 매장에 등록된 번호는 가입할 수 없어요. 매장으로 문의해 주세요.
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
