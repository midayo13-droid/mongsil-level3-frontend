"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BarChart, formatCount, formatShortMoney } from "./charts";
import { PageHead, State } from "./ui";

type Metric = "today" | "month" | "sales";

function monthLabel(month: string) {
  return `${month.slice(0, 4)}년 ${Number(month.slice(5, 7))}월`;
}
function shiftMonth(month: string, delta: number) {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

/**
 * 현황 화면: 위에는 홈과 같은 현황 카드, 카드를 고르면 아래에 그 카드의 그래프가 나와요.
 * 매출 카드와 그래프는 사장님에게만 보여요.
 */
export function StatsView() {
  const { isAdmin } = useAuth();
  const stats = useFetch<any>("/stats");
  const router = useRouter();
  // 어떤 카드를 골랐는지는 주소(?metric=)에 담아요. 홈의 현황 카드를 누르면 이 주소로 들어와요.
  const wanted = useSearchParams().get("metric");
  const metric: Metric = wanted === "month" || (wanted === "sales" && isAdmin) ? wanted : "today";
  const setMetric = (m: Metric) => router.replace(`/stats?metric=${m}`, { scroll: false });
  const [picked, setPicked] = useState<string | null>(null); // 고른 달 (null = 이번 달)
  const thisMonth: string = stats.data?.month ?? "";
  const month = picked ?? thisMonth;
  const seriesPath = metric === "today" ? "/stats/series?metric=today" : month ? `/stats/series?metric=${metric}&month=${month}` : null;
  const series = useFetch<any>(seriesPath);

  const d = stats.data;
  const hasSales = isAdmin && typeof d?.month_sales === "number";
  const mLabel = thisMonth ? `${Number(thisMonth.slice(5, 7))}월` : "이번 달";
  const cards: { key: Metric; label: string; value: number; unit: string; note: string; sales?: boolean }[] = d
    ? [
        { key: "today", label: "오늘 예약 수", value: d.today_reservations, unit: "건", note: `${d.today} · 취소된 예약은 빼요` },
        { key: "month", label: `${mLabel} 예약 건수`, value: d.month_reservations, unit: "건", note: "이번 달 날짜로 잡힌 예약" },
        ...(hasSales ? [{ key: "sales" as Metric, label: `${mLabel} 매출`, value: d.month_sales, unit: "원", note: "미용 기록의 가격 합계 · 사장님에게만 보여요", sales: true }] : []),
      ]
    : [];

  const s = series.data;
  const items = s?.items ?? [];
  const isMonthMetric = metric !== "today";
  const peak = items.length ? items.reduce((a: any, b: any) => (b.value > a.value ? b : a), items[0]) : null;
  const activeDays = items.filter((i: any) => i.value > 0).length;
  const chartTitle =
    metric === "today" ? "오늘 예약 · 시간대별" : metric === "month" ? `${month ? monthLabel(month) : ""} 예약 건수 · 날짜별` : `${month ? monthLabel(month) : ""} 매출 · 날짜별`;
  const money = metric === "sales";
  // 건수는 소수 첫째 자리까지(하루 평균이 0.1건처럼 작을 수 있어서), 매출은 원 단위 정수로 보여 줘요.
  const avgBase = money ? activeDays : items.length;
  const avg = avgBase ? s?.total / avgBase : 0;
  const avgText = money ? formatCount(Math.round(avg)) : avg.toLocaleString("ko-KR", { maximumFractionDigits: 1 });

  return (
    <>
      <PageHead title="예약 현황" sub="카드를 누르면 아래에 그래프가 나타나요." />
      <State loading={stats.loading} error={stats.error} onRetry={stats.reload}>
        <div className="stat-grid" style={{ gridTemplateColumns: `repeat(${Math.max(cards.length, 1)}, minmax(0, 1fr))` }}>
          {cards.map((c) => (
            <button key={c.key} type="button" className={`stat-card selectable${c.sales ? " sales" : ""}${metric === c.key ? " on" : ""}`} aria-pressed={metric === c.key} onClick={() => setMetric(c.key)}>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">
                {c.value.toLocaleString("ko-KR")}
                <span className="stat-unit">{c.unit}</span>
              </div>
              <div className="stat-note">{c.note}</div>
            </button>
          ))}
        </div>

        <section className="card">
          <div className="card-head">
            <h2>{chartTitle}</h2>
            {isMonthMetric && month && (
              <div className="month-nav">
                <button type="button" className="btn small" onClick={() => setPicked(shiftMonth(month, -1))} aria-label="이전 달">
                  ‹
                </button>
                <span>{monthLabel(month)}</span>
                <button type="button" className="btn small" onClick={() => setPicked(shiftMonth(month, 1))} disabled={month >= thisMonth} aria-label="다음 달">
                  ›
                </button>
              </div>
            )}
          </div>
          <State loading={series.loading && !s} error={series.error} onRetry={series.reload}>
            {s && (
              <>
                <BarChart
                  items={items}
                  unit={s.unit}
                  title={chartTitle}
                  minStep={money ? 25000 : 1}
                  formatAxis={money ? formatShortMoney : formatCount}
                  showLabel={metric === "today" ? (it) => it.label.endsWith(":00") : (_, i) => i % 2 === 0}
                />
                <ul className="chart-summary">
                  <li>
                    합계 <b>{formatCount(s.total)}</b>
                    {s.unit}
                  </li>
                  {isMonthMetric && (
                    <li>
                      {money ? "매출이 있는 날 평균" : "하루 평균"}{" "}
                      <b>{avgText}</b>
                      {s.unit}
                    </li>
                  )}
                  <li>
                    가장 많은 {metric === "today" ? "시간" : "날"}{" "}
                    <b>{peak && peak.value > 0 ? `${metric === "today" ? peak.label : `${peak.label}일`} (${formatCount(peak.value)}${s.unit})` : "-"}</b>
                  </li>
                </ul>
                <details className="chart-table">
                  <summary>표로 보기</summary>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{metric === "today" ? "시간" : "날짜"}</th>
                          <th>{money ? "매출" : "예약 건수"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((i: any) => (
                          <tr key={i.label}>
                            <td>{metric === "today" ? i.label : i.date}</td>
                            <td>
                              {formatCount(i.value)}
                              {s.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}
          </State>
        </section>
      </State>
    </>
  );
}
