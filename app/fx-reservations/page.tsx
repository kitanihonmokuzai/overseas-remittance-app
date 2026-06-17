import Link from "next/link";
import { Landmark, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatAmount, formatDate, remaining } from "@/lib/db";
import { getFxReservations } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function FxReservationsPage() {
  const reservations = await getFxReservations();
  const grouped = reservations.reduce<Record<string, Record<string, typeof reservations>>>((groups, reservation) => {
    groups[reservation.bank] ??= {};
    groups[reservation.bank][reservation.currency] ??= [];
    groups[reservation.bank][reservation.currency].push(reservation);
    return groups;
  }, {});

  return (
    <AppShell
      title="為替予約"
      description="銀行別、通貨別に為替予約の残高を確認します。"
      action={<Link className="primary" href="/fx-reservations/new"><Plus size={18} />予約登録</Link>}
    >
      <section className="panel">
        <div className="finance-list">
          {Object.entries(grouped).length === 0 ? (
            <p className="empty">為替予約はまだ登録されていません。</p>
          ) : Object.entries(grouped).map(([bank, currencies]) => (
            <div className="bank-group" key={bank}>
              <h2><Landmark size={18} />{bank}</h2>
              {Object.entries(currencies).map(([currency, items]) => (
                <table key={currency}>
                  <caption>{currency}</caption>
                  <thead><tr><th>予約No</th><th>予約日</th><th>予約額</th><th>使用済</th><th>残高</th><th>レート</th><th>期間</th></tr></thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.reservation_no}</td>
                        <td>{formatDate(item.booked_date)}</td>
                        <td>{formatAmount(item.original_amount, item.currency)}</td>
                        <td>{formatAmount(item.used_amount, item.currency)}</td>
                        <td>{formatAmount(remaining(item), item.currency)}</td>
                        <td>{item.rate}</td>
                        <td>{item.period || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
