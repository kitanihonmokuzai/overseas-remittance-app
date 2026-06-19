import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { NavLinks } from "@/components/NavLinks";
import { getPendingApprovalCount } from "@/lib/queries";
import { canOperate, roleLabel, type UserRole } from "@/lib/db";

export async function AppShell({
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
  const pendingCount = role && canOperate(role) ? await getPendingApprovalCount() : 0;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">FX</span>
          <div className="brand-text">
            <strong>海外送金管理</strong>
            <span>Treasury Console</span>
          </div>
        </div>

        <NavLinks role={role} pendingCount={pendingCount} />

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
          <div className="page-heading">
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="header-actions">
            {role ? <span className="role-badge">{roleLabel(role)}</span> : null}
            {action}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
