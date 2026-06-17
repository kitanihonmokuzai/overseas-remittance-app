import Link from "next/link";
import { ReactNode } from "react";
import { Database } from "lucide-react";

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
  title
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <strong>海外送金申請</strong>
        <span>Neon Postgres</span>
        <nav>
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="header-actions">
            <span className="mode-badge"><Database size={16} />Neon</span>
            {action}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
