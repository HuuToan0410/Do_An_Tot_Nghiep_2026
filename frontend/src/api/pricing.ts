import api from "./client";

// ── Types ──────────────────────────────────────────────────────

export type PricingStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface VehiclePricing {
  id:               number;
  vehicle:          number;
  vehicle_name:     string;
  purchase_price:   string;
  refurbish_cost:   string;
  other_cost:       string;
  total_cost:       string;
  target_price:     string;
  approved_price:   string | null;
  profit:           string;
  profit_margin:    number;
  note:             string;
  status:           PricingStatus;
  status_display:   string;
  created_by:       number | null;
  created_by_name:  string;
  approved_by:      number | null;
  approved_by_name: string;
  approved_at:      string | null;
  created_at:       string;
  updated_at:       string;
}

export interface CreatePricingPayload {
  vehicle:        number;
  purchase_price: number;
  refurbish_cost?: number;
  other_cost?:    number;
  target_price:   number;
  note?:          string;
}

export interface ApprovePricingPayload {
  approved_price: number;
  note?:          string;
}

// ── Constants ──────────────────────────────────────────────────

export const PRICING_STATUS_CONFIG: Record <
  PricingStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING:  { label: "Chờ phê duyệt", color: "text-yellow-700", bg: "bg-yellow-100" },
  APPROVED: { label: "Đã phê duyệt",  color: "text-green-700",  bg: "bg-green-100"  },
  REJECTED: { label: "Từ chối",        color: "text-red-700",    bg: "bg-red-100"    },
};

// ── Helpers ────────────────────────────────────────────────────

export function formatVNPrice(val?: string | number | null): string {
  const num = Number(val ?? 0);
  if (!num) return "0 đ";
  const ty    = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Triệu`;
  if (ty > 0)              return `${ty} Tỷ`;
  return `${trieu} Triệu`;
}

// ── API calls ──────────────────────────────────────────────────

export async function getPricings(params?: {
  status?: string;
  search?: string;
}): Promise<VehiclePricing[]> {
  const res = await api.get("/admin/pricings/", { params });
  return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
}

export async function getPricingDetail(id: number): Promise<VehiclePricing> {
  const res = await api.get(`/admin/pricings/${id}/`);
  return res.data;
}

export async function createPricing(
  data: CreatePricingPayload
): Promise<VehiclePricing> {
  const res = await api.post("/admin/pricings/", data);
  return res.data;
}

export async function updatePricing(
  id:   number,
  data: Partial<CreatePricingPayload>
): Promise<VehiclePricing> {
  const res = await api.patch(`/admin/pricings/${id}/`, data);
  return res.data;
}

export async function approvePricing(
  id:   number,
  data: ApprovePricingPayload
): Promise<VehiclePricing> {
  const res = await api.post(`/admin/pricings/${id}/approve/`, data);
  return res.data;
}

export async function rejectPricing(
  id:     number,
  reason: string
): Promise<{ message: string }> {
  const res = await api.post(`/admin/pricings/${id}/reject/`, { note: reason });
  return res.data;
}
