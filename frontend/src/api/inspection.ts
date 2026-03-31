import api from "./client";

// ── Types ──────────────────────────────────────────────────────

export type InspectionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export type InspectionCondition = "GOOD" | "FAIR" | "POOR" | "FAILED";
export type QualityGrade = "A" | "B" | "C" | "D";

export interface InspectionItemPublic {
  id:                     number;
  name:                   string;
  condition:              InspectionCondition;
  condition_display:      string;
  score:                  number | null;
  note:                   string;
  needs_repair:           boolean;
  estimated_repair_cost:  string;
  is_passed:              boolean;
}

export interface InspectionCategoryGroup {
  category: string;
  items:    InspectionItemPublic[];
}
export interface InspectionListResponse {
  results: Inspection[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface InspectionPublic {
  id:                    number;
  vehicle:               number;
  vehicle_name:          string;
  inspector_name:        string;
  quality_grade:         QualityGrade | null;
  quality_grade_display: string;
  overall_score:         number | null;
  conclusion:            string;
  recommendation:        string;
  inspection_date:       string | null;
  categories:            InspectionCategoryGroup[];
  passed_count:          number;
  failed_count:          number;
  total_items:           number;
  created_at:            string;
}
export interface InspectionCategory {
  id: number;
  name: string;
  display_order: number;
}

export interface InspectionItem {
  id: number;
  category: number | null;
  category_name: string;
  name: string;
  condition: InspectionCondition;
  condition_display: string;
  score: number | null;
  note: string;
  image: string | null;
  needs_repair: boolean;
  estimated_repair_cost: string | null;
}
export const QUALITY_GRADE_CONFIG: Record <
  QualityGrade,
  { label: string; color: string; bg: string; description: string }
> = {
  A: {
    label:       "Xuất sắc",
    color:       "text-green-700",
    bg:          "bg-green-100",
    description: "Xe trong tình trạng tốt, không có lỗi đáng kể",
  },
  B: {
    label:       "Tốt",
    color:       "text-blue-700",
    bg:          "bg-blue-100",
    description: "Xe trong tình trạng tốt, có một số lỗi nhỏ",
  },
  C: {
    label:       "Trung bình",
    color:       "text-yellow-700",
    bg:          "bg-yellow-100",
    description: "Xe cần sửa chữa một số hạng mục",
  },
  D: {
    label:       "Cần chú ý",
    color:       "text-red-700",
    bg:          "bg-red-100",
    description: "Xe có nhiều hạng mục cần sửa chữa",
  },
};
export const CONDITION_CONFIG: Record <
  InspectionCondition,
  { label: string; color: string; bg: string; is_passed: boolean }
> = {
  GOOD:   { label: "Tốt",       color: "text-green-700",  bg: "bg-green-100",  is_passed: true  },
  FAIR:   { label: "Khá",       color: "text-blue-700",   bg: "bg-blue-100",   is_passed: true  },
  POOR:   { label: "Kém",       color: "text-orange-700", bg: "bg-orange-100", is_passed: false },
  FAILED: { label: "Hỏng",      color: "text-red-700",    bg: "bg-red-100",    is_passed: false },
};
export interface Inspection {
  id: number;

  // ── Xe ──
  vehicle: number;
  vehicle_name: string;

  // ── Nhân viên kiểm định ──
  inspector: number | null;
  inspector_name: string;

  // ── Trạng thái ──
  status: InspectionStatus;
  status_display: string;

  // ── Kết quả ──
  quality_grade: QualityGrade | null;
  quality_grade_display: string;
  overall_score: string | null;
  conclusion: string;
  recommendation: string;

  // ── Thời gian ──
  inspection_date: string | null;
  /**
   * Alias hiển thị trong UI cũ — map từ inspection_date.
   * Backend có thể trả về trực tiếp hoặc FE tự map.
   */
  scheduled_date: string;

  // ── Thông tin khách hàng
  // (Backend nên trả về từ deposit/appointment liên quan,
  //  hoặc lưu trực tiếp trên Inspection nếu có)
  customer_name: string;
  phone: string;

  // ── Điểm từng hạng mục (legacy — có thể dùng items thay thế) ──
  engine_score?: number;
  body_score?: number;
  interior_score?: number;
  electrical_score?: number;
  result_note?: string;

  // ── Minh bạch cho khách ──
  is_public: boolean;

  // ── Items chi tiết ──
  items?: InspectionItem[];
  total_items?: number;
  passed_items?: number;
  needs_repair_count?: number;

  created_at: string;
  updated_at?: string;
}

// ── Payloads ───────────────────────────────────────────────────

export interface InspectionCreatePayload {
  vehicle: number;
  inspection_date?: string;
  note?: string;
}

export interface InspectionItemCreatePayload {
  category?: number;
  name: string;
  condition: InspectionCondition;
  score?: number;
  note?: string;
  image?: File;
  needs_repair?: boolean;
  estimated_repair_cost?: number;
}

export interface InspectionCompletePayload {
  conclusion: string;
  recommendation?: string;
}

// ── API calls ──────────────────────────────────────────────────

/** Danh sách phiếu kiểm định */
// src/api/inspections.ts

export async function getInspections(params?: {
  vehicle?: number;
  status?: string;
  page?: number;       // ← thêm
  page_size?: number;  // ← thêm
  search?: string;     // ← thêm
}): Promise<InspectionListResponse | Inspection[]> {
  const res = await api.get("/inspections/", { params });
  if (res.data?.count !== undefined) return res.data as InspectionListResponse;
  const list: Inspection[] = res.data?.results ?? res.data;
  return list.map((item) => ({
    ...item,
    scheduled_date: item.scheduled_date ?? item.inspection_date ?? "",
    customer_name:  item.customer_name  ?? "",
    phone:          item.phone          ?? "",
    inspector_name: item.inspector_name ?? "",
  }));
}
/** Chi tiết phiếu kiểm định */
export async function getInspectionDetail(id: number): Promise<Inspection> {
  const res = await api.get(`/inspections/${id}/`);
  const item: Inspection = res.data;
  return {
    ...item,
    scheduled_date: item.scheduled_date ?? item.inspection_date ?? "",
    customer_name:  item.customer_name  ?? "",
    phone:          item.phone          ?? "",
    inspector_name: item.inspector_name ?? "",
  };
}

/** Hồ sơ kiểm định công khai cho khách hàng */
export async function getPublicInspection(id: number): Promise<Inspection> {
  const res = await api.get(`/inspections/public/${id}/`);
  return res.data;
}

/** Tạo phiếu kiểm định mới */
export async function createInspection(
  data: InspectionCreatePayload
): Promise<Inspection> {
  const res = await api.post("/inspections/create/", data);
  return res.data;
}

/** Cập nhật phiếu kiểm định */
export async function updateInspection(
  id: number,
  data: Partial<Pick<Inspection, "status" | "conclusion" | "recommendation" | "is_public">>
): Promise<Inspection> {
  const res = await api.patch(`/inspections/${id}/`, data);
  return res.data;
}

/** Thêm hạng mục vào phiếu kiểm định */
export async function addInspectionItem(
  inspectionId: number,
  data: InspectionItemCreatePayload
): Promise<InspectionItem> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      formData.append(key, val instanceof File ? val : String(val));
    }
  });
  const res = await api.post(
    `/inspections/${inspectionId}/items/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

/** Cập nhật hạng mục kiểm định */
export async function updateInspectionItem(
  itemId: number,
  data: Partial<InspectionItemCreatePayload>
): Promise<InspectionItem> {
  const res = await api.patch(`/inspections/items/${itemId}/`, data);
  return res.data;
}

/** Xóa hạng mục kiểm định */
export async function deleteInspectionItem(itemId: number): Promise<void> {
  await api.delete(`/inspections/items/${itemId}/`);
}

/** Hoàn thành kiểm định — tính điểm & xếp loại */
export async function completeInspection(
  id: number,
  data: InspectionCompletePayload
): Promise<Inspection> {
  const res = await api.post(`/inspections/${id}/complete/`, data);
  return res.data;
}

/** Công khai / ẩn kết quả kiểm định cho khách hàng */
export async function publishInspection(
  id: number,
  isPublic: boolean
): Promise<{ message: string; is_public: boolean }> {
  const res = await api.post(`/inspections/${id}/publish/`, {
    is_public: isPublic,
  });
  return res.data;
}

/** Xóa phiếu kiểm định */
export async function deleteInspection(id: number): Promise<void> {
  await api.delete(`/inspections/${id}/`);
}

/** Danh mục kiểm định */
export async function getInspectionCategories(): Promise<InspectionCategory[]> {
  const res = await api.get("/inspections/categories/");
  return res.data?.results ?? res.data;
}

// ── Legacy alias — giữ tương thích với code cũ ────────────────
export async function updateInspectionStatus(
  id: number,
  status: InspectionStatus
): Promise<Inspection> {
  return updateInspection(id, { status });
}

export async function getVehiclePublicInspection(
  vehicleId: number | string
): Promise<InspectionPublic | null> {
  try {
    const res = await api.get(`/vehicles/${vehicleId}/inspection/`);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}