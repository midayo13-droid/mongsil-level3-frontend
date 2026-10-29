"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { homeFor, useAuth } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

// 예약 신청·신규 등록은 각 화면의 버튼으로 해요. (왼쪽 메뉴에는 두지 않아요)
const WORK: NavItem[] = [
  { href: "/", label: "홈", icon: "🏠", exact: true },
  { href: "/reservations", label: "예약관리", icon: "🗓️" },
  { href: "/dogs", label: "강아지", icon: "🐶" },
  { href: "/records", label: "미용 기록", icon: "✂️" },
  { href: "/stats", label: "예약 현황", icon: "📊" },
];
const NEWS: NavItem[] = [
  { href: "/notices", label: "공지사항", icon: "📢" },
  { href: "/events", label: "이벤트", icon: "🎁" },
];
// 사장님만 쓰는 메뉴: 위 메뉴와 겹치지 않는 것만 모았어요.
// (고객·미용 기록·공지·이벤트의 등록·수정·삭제는 위 화면 안에서 사장님에게만 버튼이 보여요.)
const MANAGE: NavItem[] = [
  { href: "/admin/accounts", label: "회원 관리", icon: "👥" },
  { href: "/admin/groomers", label: "관리사 관리", icon: "💇" },
  { href: "/admin/closed-days", label: "휴무일 관리", icon: "🚫" },
  { href: "/admin/reseed", label: "가상 데이터", icon: "♻️" },
];

/** 로그인한 사람만 들어올 수 있는 틀: 왼쪽 메뉴 + 본문 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, checking, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!checking && !user) router.replace("/login");
    // 고객은 관리자 화면에 들어올 수 없어요. 고객 화면으로 보내요.
    if (!checking && user && user.role === "고객") router.replace(homeFor(user));
  }, [checking, user, router]);

  if (checking || !user || user.role === "고객") {
    return <p className="empty" style={{ marginTop: 80 }}>로그인 정보를 확인하는 중이에요...</p>;
  }

  const active = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={`side-link${active(item) ? " active" : ""}`}
        onClick={() => setOpen(false)} // 휴대폰에서는 메뉴를 누르면 메뉴가 닫혀요
      >
        <span className="side-icon" aria-hidden>
          {item.icon}
        </span>
        {item.label}
      </Link>
    ));

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="메뉴 열기">
          ☰
        </button>
        <span className="topbar-title">
          <span className="paw" aria-hidden />
          몽실 미용실
        </span>
      </header>
      <aside className={`sidebar${open ? " open" : ""}`}>
        <Link href="/" className="side-logo">
          <span className="paw" aria-hidden />
          몽실 미용실
          <small>예약·고객 관리</small>
        </Link>

        <div className="side-user">
          <div className="avatar" aria-hidden>
            {user.name.slice(0, 1)}
          </div>
          <div>
            <div className="side-name">{user.name}</div>
            <span className={`badge ${isAdmin ? "admin" : "green"}`}>{isAdmin ? "사장님 (총관리자)" : "관리사 (일반관리자)"}</span>
          </div>
        </div>

        <nav className="side-nav">
          <div className="side-group">업무</div>
          {renderItems(WORK)}
          <div className="side-group">소식</div>
          {renderItems(NEWS)}
          {isAdmin && (
            <>
              <div className="side-group">관리 (사장님 전용)</div>
              {renderItems(MANAGE)}
            </>
          )}
        </nav>

        <button className="side-logout" onClick={logout}>
          로그아웃
        </button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <main className="main">{children}</main>
    </div>
  );
}

/** 사장님만 볼 수 있는 화면 앞에 둬요. 관리사가 주소로 들어오면 안내만 보여 줘요. */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <section className="card" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <h2>사장님만 쓸 수 있는 화면이에요</h2>
        <p className="sub">관리사 계정으로는 이 화면을 볼 수 없어요. 필요한 일이 있으면 사장님께 말씀해 주세요.</p>
        <Link href="/" className="btn primary">
          홈으로 가기
        </Link>
      </section>
    );
  }
  return <>{children}</>;
}
