export type Payee = {
  id: string;
  name: string;
  bank_name: string;
  branch_name: string;
  account_no: string;
  account_name: string;
  swift: string;
  country: string;
  address: string;
  default_currency: string;
};

export type FxReservation = {
  id: string;
  reservation_no: string;
  currency: string;
  bank: string;
  booked_date: string;
  original_amount: string | number;
  used_amount: string | number;
  rate: string | number;
  period: string;
};

export type ForeignDepositAccount = {
  id: string;
  bank: string;
  currency: string;
  balance: string | number;
  account_name: string;
};

export type RemittanceRequest = {
  id: string;
  remittance_date: string;
  payee_name: string;
  amount: string | number;
  currency: string;
  settlement_method: "スポット" | "為替予約" | "外貨預金";
  memo: string;
  status: "下書き" | "申請中" | "支払済";
  created_at: string;
  file_count: number;
};

export type FxRegistrationHistory = {
  id: string;
  reservation_no: string;
  bank: string;
  currency: string;
  amount: string | number;
  rate: string | number;
  created_at: string;
};

export type DepositTransaction = {
  id: string;
  bank: string;
  currency: string;
  amount: string | number;
  memo: string;
  created_at: string;
};

export function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

export function formatAmount(value: string | number, currency: string) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(toNumber(value));
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("ja-JP");
}

export function remaining(reservation: FxReservation) {
  return toNumber(reservation.original_amount) - toNumber(reservation.used_amount);
}
