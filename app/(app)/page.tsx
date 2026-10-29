"use client";

import Link from "next/link";
import { useFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { Section, State } from "@/components/ui";

/** 홈 맨 위의 현황 카드. 사장님은 3개(매출 포함), 관리사는 2개이고 카드 너비는 개수에 맞게 넓어져요. */
function StatCards() {
  const { data, error } = useFetch<any>("/stats");
  if (error || !data) return null;
  const month = data.month ? `${Number(data.month.slice(5, 7))}월` : "이번 달";
  const hasSales = typeof data.month_sales === "number";
  return (
    <div className="stat-grid" style={{ gridTemplateColumns: `repeat(${hasSales ? 3 : 2}, minmax(0, 1fr))` }}>
      <div className="stat-card">
        <div className="stat-label">오늘 예약 수</div>
        <div className="stat-value">
          <Link href="/stats?metric=today" className="stat-num" aria-label={`오늘 예약 ${data.today_reservations}건, 현황 그래프로 이동`}>
            {data.today_reservations.toLocaleString("ko-KR")}
            <span className="stat-unit">건</span>
          </Link>
        </div>
        <div className="stat-note">{data.today} · 취소된 예약은 빼요</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{month} 예약 건수</div>
        <div className="stat-value">
          <Link href="/stats?metric=month" className="stat-num" aria-label={`${month} 예약 ${data.month_reservations}건, 현황 그래프로 이동`}>
            {data.month_reservations.toLocaleString("ko-KR")}
            <span className="stat-unit">건</span>
          </Link>
        </div>
        <div className="stat-note">이번 달 날짜로 잡힌 예약</div>
      </div>
      {hasSales && (
        <div className="stat-card sales">
          <div className="stat-label">{month} 매출</div>
          <div className="stat-value">
            <Link href="/stats?metric=sales" className="stat-num" aria-label={`${month} 매출 ${data.month_sales}원, 현황 그래프로 이동`}>
              {data.month_sales.toLocaleString("ko-KR")}
              <span className="stat-unit">원</span>
            </Link>
          </div>
          <div className="stat-note">미용 기록의 가격 합계 · 사장님에게만 보여요</div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch<any>("/summary");
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            {user?.name.endsWith("님") ? user.name : `${user?.name}님`}, 안녕하세요 🐾
          </h1>
          <p>전화로 예약을 받으면 ‘예약 신청’으로, 새 손님이 오면 ‘신규 등록’으로 입력해 주세요.</p>
        </div>
        <div className="actions">
          <Link href="/reservations/new" className="btn primary big">
            + 예약 신청
          </Link>
          <Link href="/register" className="btn big">
            신규 등록
          </Link>
        </div>
      </div>
      <StatCards />

      <State loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="grid">
            <Section title={`오늘 예약 (${data.todayReservations.length}건)`} href="/reservations">
              {data.todayReservations.length === 0 ? (
                <p className="empty">오늘 예약이 없어요.</p>
              ) : (
                <ul className="list">
                  {data.todayReservations.map((r: any) => (
                    <li key={r.id}>
                      <Link href={`/reservations/${r.id}`} className="row">
                        <div className="title">
                          {r.reserved_time} · {r.dog_name}
                        </div>
                        <div className="meta">
                          {r.groomer_name} 관리사 · {r.style}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="최근 미용 기록" href="/records">
              {data.records.length === 0 ? (
                <p className="empty">미용 기록이 아직 없어요.</p>
              ) : (
                <ul className="list">
                  {data.records.map((r: any) => (
                    <li key={r.id}>
                      <Link href={`/records/${r.id}`} className="row">
                        <div className="title">
                          {r.dog_name} · {r.style}
                        </div>
                        <div className="meta">
                          {formatDate(r.groomed_at)} · {r.groomer_name} · {formatPrice(r.price)}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="강아지" href="/dogs">
              {data.dogs.length === 0 ? (
                <p className="empty">등록된 강아지가 없어요.</p>
              ) : (
                <ul className="list">
                  {data.dogs.map((d: any) => (
                    <li key={d.id}>
                      <Link href={`/dogs/${d.id}`} className="row">
                        <div className="title">{d.name}</div>
                        <div className="meta">
                          {d.breed} · {d.gender} · {d.age}살 · 보호자 {d.guardian_name}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div>
              <Section title="공지사항" href="/notices">
                {data.notices.length === 0 ? (
                  <p className="empty">공지사항이 없어요.</p>
                ) : (
                  <ul className="list">
                    {data.notices.map((n: any) => (
                      <li key={n.id}>
                        <Link href={`/notices/${n.id}`} className="row">
                          <div className="title">
                            {n.title} {n.file_count > 0 && <span className="badge gray">📎 첨부 {n.file_count}</span>}
                          </div>
                          <div className="meta">{formatDate(n.created_at)}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="이벤트" href="/events">
                {data.events.length === 0 ? (
                  <p className="empty">이벤트가 없어요.</p>
                ) : (
                  <ul className="list">
                    {data.events.map((e: any) => (
                      <li key={e.id}>
                        <Link href={`/events/${e.id}`} className="row">
                          <div className="title">
                            {e.title} {e.ongoing && <span className="badge green">진행 중</span>}
                          </div>
                          <div className="meta">
                            {formatDate(e.start_date)} ~ {formatDate(e.end_date)}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        )}
      </State>
    </>
  );
}
