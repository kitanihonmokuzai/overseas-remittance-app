"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/db";

const baseItems = [
  { href: "/transfer-request", label: "送金申請" },
  { href: "/fx-reservations", label: "為替予約" },
  { href: "/foreign-deposits", label: "外貨預金" },
  { href: "/history", label: "履歴" }
];

export function NavLinks({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const items = role === "admin"
    ? [...baseItems, { href: "/admin/users", label: "ユーザー管理" }]
    : baseItems;

  return (
    <nav>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-link active" : "nav-link"}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
