import { createClient } from "@/lib/supabase/server";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: unknown[][]) {
  // Excel が UTF-8 を正しく開くよう BOM を付与
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function monthRange(month: string | null) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, mon - 1, 1));
    const end = new Date(Date.UTC(year, mon, 1));
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      startDate: `${year}-${pad(mon)}-01`,
      endDate: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-01`,
      label: month
    };
  }
  return null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return new Response("認証が必要です。", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();
  const role = profile?.role ?? "user";
  if (role !== "admin" && role !== "approver") {
    return new Response("権限がありません。", { status: 403 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "gain-loss";
  const range = monthRange(url.searchParams.get("month"));
  const suffix = range ? range.label : "all";

  let rows: unknown[][] = [];
  let filename = "export.csv";

  if (type === "gain-loss") {
    let query = supabase
      .from("fx_gain_loss_history")
      .select("created_at, payee_name, currency, foreign_amount, receipt_rate, payment_rate, gain_loss_jpy")
      .order("created_at", { ascending: true });
    if (range) {
      query = query.gte("created_at", range.startIso).lt("created_at", range.endIso);
    }
    const { data, error } = await query;
    if (error) {
      return new Response(error.message, { status: 500 });
    }
    rows = [["処理日", "受取人", "通貨", "外貨金額", "入金時レート", "支払時レート", "為替差損益(円)"]];
    for (const r of data ?? []) {
      rows.push([
        new Date(r.created_at).toLocaleString("ja-JP"),
        r.payee_name,
        r.currency,
        r.foreign_amount,
        r.receipt_rate,
        r.payment_rate,
        r.gain_loss_jpy
      ]);
    }
    filename = `gain-loss-${suffix}.csv`;
  } else if (type === "requests") {
    let query = supabase
      .from("remittance_requests")
      .select("remittance_date, payee_name, currency, amount, settlement_method, status, created_at")
      .order("remittance_date", { ascending: true });
    if (range) {
      query = query.gte("remittance_date", range.startDate).lt("remittance_date", range.endDate);
    }
    const { data, error } = await query;
    if (error) {
      return new Response(error.message, { status: 500 });
    }
    rows = [["送金日", "受取人", "通貨", "金額", "決済方法", "ステータス", "申請日時"]];
    for (const r of data ?? []) {
      rows.push([
        r.remittance_date,
        r.payee_name,
        r.currency,
        r.amount,
        r.settlement_method,
        r.status,
        new Date(r.created_at).toLocaleString("ja-JP")
      ]);
    }
    filename = `requests-${suffix}.csv`;
  } else {
    return new Response("不明な種別です。", { status: 400 });
  }

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
