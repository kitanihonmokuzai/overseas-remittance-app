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
  bank_country?: string;
  bank_city?: string;
  bank_street?: string;
  bank_postal?: string;
  origin?: string;
  shipping_country?: string;
  shipping_city?: string;
  charge_bearer?: string;
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

export type ForeignDepositLot = {
  id: string;
  deposit_id: string;
  received_date: string;
  payer_name: string;
  bank: string;
  currency: string;
  original_amount: string | number;
  remaining_amount: string | number;
  receipt_rate: string | number;
  memo: string;
  created_at: string;
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
  deposit_lot_id?: string | null;
  payment_rate?: string | number | null;
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
  received_date?: string | null;
  payer_name?: string | null;
  receipt_rate?: string | number | null;
  memo: string;
  created_at: string;
};

export type FxGainLossHistory = {
  id: string;
  request_id: string;
  deposit_lot_id: string;
  payee_name: string;
  currency: string;
  foreign_amount: string | number;
  receipt_rate: string | number;
  payment_rate: string | number;
  gain_loss_jpy: string | number;
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

export function formatRate(value: string | number | null | undefined) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2
  }).format(toNumber(value));
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
