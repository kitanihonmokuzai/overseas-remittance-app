import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PayeeForm } from "@/components/PayeeForm";
import { canOperate } from "@/lib/db";
import { getCurrentProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewPayeePage() {
  const profile = await getCurrentProfile();
  if (!canOperate(profile.role)) {
    redirect("/dashboard");
  }
  return (
    <AppShell title="受取人マスタ 新規" description="新しい送金先を登録します。" role={profile.role}>
      <PayeeForm />
    </AppShell>
  );
}
