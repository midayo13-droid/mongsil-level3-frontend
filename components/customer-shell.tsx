"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor, useAuth } from "@/lib/auth";

// 아이콘은 화면 모양(CSS)으로 그려요: home · cal · paw
const TABS = [
  { href: "/my", label: "홈", icon: "home" },
  { href: "/my/reserve", label: "예약", icon: "cal", reserve: true },
  { href: "/my/dogs", label: "내 강아지", icon: "paw" },
];

/** 고객 화면의 틀: 위쪽 이름 줄(이름을 누르면 내 정보 수정) + 아래쪽 탭 메뉴(홈·예약·내 강아지). "내 예약"은 메뉴 없이 화면으로만 들어가요. */
export function CustomerShell({ children }: { children: React.ReactNode }) {
  const { user, checking } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (checking) return;
    if (!user) router.replace("/login");
    // 고객이 아닌 사람은 관리자 화면으로 보내요.
    else if (user.role !== "고객") router.replace(homeFor(user));
  }, [checking, user, router]);

  if (checking || !user || user.role !== "고객") {
    return <p className="empty" style={{ marginTop: 80 }}>불러오는 중이에요...</p>;
  }

  // 내 예약·공지·이벤트는 탭 메뉴에 없고 홈에서 들어가므로, 홈 탭이 켜진 것으로 보여 줘요.
  const homeLike = ["/my/reservations", "/my/notices", "/my/events"].some((p) => pathname.startsWith(p));
  const isActive = (href: string) =>
    href === "/my" ? pathname === "/my" || homeLike : pathname.startsWith(href);

  return (
    <div className="cust">
      <div className="cust-wrap">
        <header className="cust-top">
          <Link href="/my" className="cust-logo">
            <span className="paw" aria-hidden />
            몽실 미용실
          </Link>
          <Link href="/my/profile" className={`cust-user${pathname.startsWith("/my/profile") ? " on" : ""}`} aria-label="내 정보 수정">
            {user.name}님 <span aria-hidden>›</span>
          </Link>
        </header>
        <main className="cust-main">{children}</main>
        <nav className="cust-tabs" aria-label="메뉴">
          <div className="cust-tabs-inner">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`cust-tab${isActive(t.href) ? " active" : ""}${t.reserve ? " reserve" : ""}`}
              >
                <span className={`ico ico-${t.icon}`} aria-hidden />
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
