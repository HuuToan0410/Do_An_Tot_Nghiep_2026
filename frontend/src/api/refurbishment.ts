import api from "./client";

// ── Types ──────────────────────────────────────────────────────

export type RefurbishmentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type RefurbishmentItemType = "LABOR" | "PARTS" | "OTHER";

export interface RefurbishmentItem {
  id:                number;
  name:              string;
  item_type:         RefurbishmentItemType;
  item_type_display: string;
  quantity:          number;
  unit_cost:         string;
  cost:              string;      // read-only = quantity × unit_cost
  description:       string;
  is_completed:      boolean;
  created_at:        string;
}

export interface RefurbishmentOrder {
  id:               number;
  vehicle:          number;
  vehicle_name:     string;
  technician:       number | null;
  technician_name:  string;
  approved_by:      number | null;
  approved_by_name: string;
  status:           RefurbishmentStatus;
  status_display:   string;
  note:             string;
  items:            RefurbishmentItem[];
  total_cost:       string;
  start_date:       string | null;
  completed_date:   string | null;
  created_at:       string;
  updated_at:       string;
}

export interface RefurbishmentCreatePayload {
  vehicle:     number;
  technician?: number | null;
  note?:       string;
  start_date?: string;
}

export interface RefurbishmentItemPayload {
  name:          string;
  item_type:     RefurbishmentItemType;
  quantity:      number;
  unit_cost:     number;
  description?:  string;
  is_completed?: boolean;
}

// ── Constants ──────────────────────────────────────────────────

export const REFURBISHMENT_STATUS_CONFIG: Record <
  RefurbishmentStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING:     { label: "Chờ tân trang",  color: "text-yellow-700", bg: "bg-yellow-100" },
  IN_PROGRESS: { label: "Đang tân trang", color: "text-blue-700",   bg: "bg-blue-100"   },
  COMPLETED:   { label: "Hoàn thành",     color: "text-green-700",  bg: "bg-green-100"  },
  CANCELLED:   { label: "Đã hủy",         color: "text-gray-700",   bg: "bg-gray-100"   },
};

export const ITEM_TYPE_CONFIG: Record <
  RefurbishmentItemType,
  { label: string; color: string; bg: string }
> = {
  PARTS: { label: "Phụ tùng",  color: "text-orange-700", bg: "bg-orange-100" },
  LABOR: { label: "Nhân công", color: "text-blue-700",   bg: "bg-blue-100"   },
  OTHER: { label: "Khác",      color: "text-gray-700",   bg: "bg-gray-100"   },
};

// ── API calls ──────────────────────────────────────────────────

/** Danh sách lệnh tân trang */
export async function getRefurbishmentOrders(params?: {
  vehicle?: number;
  status?: string;
  search?: string;
}): Promise<RefurbishmentOrder[]> {
  const res = await api.get("/refurbishments/", { params });
  // Hỗ trợ cả paginated và plain list
  return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
}

/** Chi tiết lệnh tân trang */
export async function getRefurbishmentDetail(
  id: number
): Promise<RefurbishmentOrder> {
  const res = await api.get(`/refurbishments/${id}/`);
  return res.data;
}

/** Tạo lệnh tân trang */
export async function createRefurbishmentOrder(
  data: RefurbishmentCreatePayload
): Promise<RefurbishmentOrder> {
  const res = await api.post("/refurbishments/create/", data);
  return res.data;
}
/** sau khi tân trang */
export async function startRefurbishmentOrder(
  id: number
): Promise<{ message: string }> {
  const res = await api.post(`/refurbishments/${id}/start/`);
  return res.data;
}

/** Cập nhật lệnh tân trang (note, technician, start_date) */
export async function updateRefurbishmentOrder(
  id:   number,
  data: Partial<RefurbishmentCreatePayload>
): Promise<RefurbishmentOrder> {
  const res = await api.patch(`/refurbishments/${id}/`, data);
  return res.data;
}

/** Thêm hạng mục vào lệnh */
export async function addRefurbishmentItem(
  orderId: number,
  data:    RefurbishmentItemPayload
): Promise<RefurbishmentItem> {
  const res = await api.post(`/refurbishments/${orderId}/items/`, data);
  return res.data;
}

/** Cập nhật hạng mục */
export async function updateRefurbishmentItem(
  itemId: number,
  data:   Partial<RefurbishmentItemPayload>
): Promise<RefurbishmentItem> {
  const res = await api.patch(`/refurbishments/items/${itemId}/`, data);
  return res.data;
}

/** Xóa hạng mục */
export async function deleteRefurbishmentItem(
  itemId: number
): Promise<void> {
  await api.delete(`/refurbishments/items/${itemId}/`);
}


/** Nghiệm thu → COMPLETED, cập nhật xe → READY_FOR_SALE */
export async function completeRefurbishmentOrder(
  id: number
): Promise<{ message: string; total_cost: string }> {
  const res = await api.post(`/refurbishments/${id}/complete/`);
  return res.data;
}

/** Hủy lệnh tân trang — chỉ ADMIN */
export async function cancelRefurbishmentOrder(
  id:      number,
  reason?: string
): Promise<{ message: string }> {
  const res = await api.post(`/refurbishments/${id}/cancel/`, {
    reason: reason ?? "",
  });
  return res.data;
}