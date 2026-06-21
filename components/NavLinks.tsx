"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/db";

const baseItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/transfer-request", label: "送金申請" },
  { href: "/approvals", label: "承認・支払", operatorOnly: true },
  { href: "/fx-reservations", label: "為替予約" },
  { href: "/foreign-deposits", label: "外貨預金" },
  { href: "/history", label: "履歴" }
];

export function NavLinks({ role, pendingCount = 0 }: { role?: UserRole; pendingCount?: number }) {
  const pathname = usePathname();
  const isOperator = role === "admin" || role === "approver";

  const items = baseItems
    .filter((item) => !item.operatorOnly || isOperator)
    .concat(role === "admin" ? [{ href: "/audit", label: "監査ログ" }, { href: "/admin/users", label: "ユーザー管理" }] : []);

  return (
    <nav>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showBadge = item.href === "/approvals" && pendingCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-link active" : "nav-link"}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
            {showBadge ? <span className="nav-badge" aria-label={`承認待ち ${pendingCount}件`}>{pendingCount}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
