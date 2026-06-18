import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { updateUserRole } from "@/lib/actions";
import { roleLabel } from "@/lib/db";
import { getCurrentProfile, getProfiles } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function UsersAdminPage() {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") {
    redirect("/transfer-request");
  }

  const profiles = await getProfiles();

  return (
    <AppShell title="ユーザー管理" description="利用者の権限を管理します。" role={profile.role}>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>メールアドレス</th><th>表示名</th><th>現在の権限</th><th>変更</th></tr></thead>
            <tbody>
              {profiles.map((item) => (
                <tr key={item.id}>
                  <td>{item.email || item.id}</td>
                  <td>{item.display_name || "-"}</td>
                  <td>{roleLabel(item.role)}</td>
                  <td>
                    <form action={updateUserRole} className="inline-form">
                      <input name="user_id" type="hidden" value={item.id} />
                      <select name="role" defaultValue={item.role}>
                        <option value="admin">管理者</option>
                        <option value="approver">承認者</option>
                        <option value="user">利用者</option>
                      </select>
                      <SubmitButton className="secondary small" pendingLabel="更新中...">更新</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
