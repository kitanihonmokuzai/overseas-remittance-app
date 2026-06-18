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
  last_used_at?: string | null;
  last_used_amount?: string | number | null;
};

export type UserRole = "admin" | "approver" | "user";

export type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
};

export type SettlementMethod = "スポット" | "為替予約" | "外貨預金";

export type SettlementAllocation = {
  id: string;
  request_id: string;
  method: SettlementMethod;
  reservation_id: string | null;
  foreign_deposit_id: string | null;
  amount: string | number;
};

export type RemittanceRequest = {
  id: string;
  remittance_date: string;
  payee_name: string;
  amount: string | number;
  currency: string;
  settlement_method: SettlementMethod | "複合" | null;
  memo: string;
  status: "下書き" | "申請中" | "支払済";
  created_at: string;
  file_count: number;
  remittance_settlement_allocations?: SettlementAllocation[];
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

export function roleLabel(role: UserRole) {
  if (role === "admin") return "管理者";
  if (role === "approver") return "承認者";
  return "利用者";
}

export function canOperate(role: UserRole) {
  return role === "admin" || role === "approver";
}

export function canDeleteHistory(role: UserRole) {
  return role === "admin";
}
