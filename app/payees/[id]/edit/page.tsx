import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PayeeForm } from "@/components/PayeeForm";
import { canOperate } from "@/lib/db";
import { getCurrentProfile, getPayeeById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditPayeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!canOperate(profile.role)) {
    redirect("/dashboard");
  }
  const payee = await getPayeeById(id);
  if (!payee) {
    notFound();
  }
  return (
    <AppShell title="受取人マスタ 編集" description="送金先の内容を編集します。" role={profile.role}>
      <PayeeForm payee={payee} />
    </AppShell>
  );
}
