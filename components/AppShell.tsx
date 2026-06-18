import Link from "next/link";
import { ReactNode } from "react";
import { Database, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { roleLabel, type UserRole } from "@/lib/db";

const navItems = [
  { href: "/transfer-request", label: "送金申請" },
  { href: "/fx-reservations", label: "為替予約" },
  { href: "/foreign-deposits", label: "外貨預金" },
  { href: "/history", label: "履歴" }
];

export function AppShell({
  action,
  children,
  description,
  role,
  title
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  role?: UserRole;
  title: string;
}) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <strong>海外送金申請</strong>
        <span>Supabase</span>
        <nav>
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          {role === "admin" ? <Link href="/admin/users">ユーザー管理</Link> : null}
        </nav>
        <form action={signOut} className="sidebar-footer">
          <SubmitButton
            className="sidebar-button"
            icon={<LogOut size={16} />}
            notice="ログアウトしています。"
            pendingLabel="ログアウト中..."
          >
            ログアウト
          </SubmitButton>
        </form>
      </aside>

      <section className="main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="header-actions">
            <span className="mode-badge"><Database size={16} />Supabase</span>
            {role ? <span className="mode-badge">{roleLabel(role)}</span> : null}
            {action}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
