"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Alert, confirmDelete, PageHead } from "@/components/ui";

export default function ReseedPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function reseed() {
    if (
      !confirmDelete(
        "가상 데이터를 다시 채울까요?\n\n지금 있는 예약과 AI 사용 기록이 모두 지워지고, 앞으로 2주 안의 가상 예약으로 바뀌어요.\n계정, 휴무일, 고객·강아지·미용 기록은 그대로예요.",
      )
    )
      return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api<{ message: string; created: number }>("/admin/reseed", { method: "POST" });
      setResult({ kind: "ok", text: `${r.message} (가상 예약 ${r.created}건)` });
    } catch (e: any) {
      setResult({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="가상 데이터 다시 채우기" sub="시연이나 연습용으로 예약 데이터를 처음 상태로 되돌려요." />
      {result && <Alert kind={result.kind}>{result.text}</Alert>}
      <section className="card">
        <h2>무엇이 바뀌나요?</h2>
        <div className="grid">
          <div className="box" style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
            <b>지워지고 다시 채워져요</b>
            <ul>
              <li>예약 (앞으로 2주 안의 가상 예약으로)</li>
              <li>AI 사용 기록 (하루 사용 횟수가 처음으로)</li>
            </ul>
          </div>
          <div className="box" style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
            <b>그대로 남아요</b>
            <ul>
              <li>로그인 계정 (사장님·관리사)</li>
              <li>휴무일</li>
              <li>고객·강아지·주의사항·미용 기록·관리사·공지·이벤트</li>
            </ul>
          </div>
        </div>
        <p className="sub" style={{ marginTop: 12 }}>
          고객·강아지 같은 데이터는 기존 Level 1 사이트와 함께 쓰기 때문에 지우지 않아요.
        </p>
        <button className="btn admin big" onClick={reseed} disabled={busy}>
          {busy ? "다시 채우는 중..." : "가상 데이터 다시 채우기"}
        </button>
      </section>
    </>
  );
}
