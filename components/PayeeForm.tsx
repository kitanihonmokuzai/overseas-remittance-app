import { Save } from "lucide-react";
import { savePayee } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Payee } from "@/lib/db";

export function PayeeForm({ payee }: { payee?: Payee }) {
  return (
    <form action={savePayee} className="panel request-document">
      <div className="document-title">
        <h2>受取人マスタ</h2>
        <span>{payee ? "編集" : "新規登録"}</span>
      </div>
      {payee ? <input name="id" type="hidden" value={payee.id} /> : null}

      <section className="document-section">
        <h3>1. 基本情報</h3>
        <div className="form-grid compact">
          <label>登録名称<input name="name" required defaultValue={payee?.name} /></label>
          <label>
            既定通貨
            <select name="default_currency" defaultValue={payee?.default_currency ?? "USD"}>
              <option>USD</option>
              <option>EUR</option>
              <option>JPY</option>
            </select>
          </label>
          <label>受取人名義<input name="account_name" defaultValue={payee?.account_name} /></label>
          <label>国<input name="country" defaultValue={payee?.country} /></label>
          <label className="full">住所<input name="address" defaultValue={payee?.address} /></label>
        </div>
      </section>

      <section className="document-section">
        <h3>2. 銀行口座</h3>
        <div className="form-grid compact">
          <label>銀行名<input name="bank_name" defaultValue={payee?.bank_name} /></label>
          <label>支店名<input name="branch_name" defaultValue={payee?.branch_name} /></label>
          <label>口座番号<input name="account_no" defaultValue={payee?.account_no} /></label>
          <label>SWIFT<input name="swift" defaultValue={payee?.swift} /></label>
        </div>
      </section>

      <section className="document-section">
        <h3>3. 受取銀行・船積情報</h3>
        <div className="form-grid compact">
          <label>受取銀行 国<input name="bank_country" defaultValue={payee?.bank_country} /></label>
          <label>受取銀行 都市<input name="bank_city" defaultValue={payee?.bank_city} /></label>
          <label>受取銀行 通り・番地<input name="bank_street" defaultValue={payee?.bank_street} /></label>
          <label>受取銀行 郵便番号<input name="bank_postal" defaultValue={payee?.bank_postal} /></label>
          <label>原産地<input name="origin" defaultValue={payee?.origin} /></label>
          <label>
            手数料負担区分
            <select name="charge_bearer" defaultValue={payee?.charge_bearer ?? ""}>
              <option value="">選択してください</option>
              <option>送金人負担</option>
              <option>受取人負担</option>
              <option>折半</option>
            </select>
          </label>
          <label>船積地 国<input name="shipping_country" defaultValue={payee?.shipping_country} /></label>
          <label>船積地 都市<input name="shipping_city" defaultValue={payee?.shipping_city} /></label>
        </div>
      </section>

      <div className="actions document-actions">
        <SubmitButton className="primary" icon={<Save size={18} />} notice="受取人を保存しています。" pendingLabel="保存中...">
          保存
        </SubmitButton>
      </div>
    </form>
  );
}
