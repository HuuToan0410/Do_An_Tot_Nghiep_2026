import type { AxiosError } from "axios";
import api from "./client";



// ── Interfaces ─────────────────────────────────────────────────

export type VehicleStatus =
  | "PURCHASED"
  | "WAIT_INSPECTION"
  | "INSPECTING"
  | "INSPECTED"
  | "WAIT_REFURBISH"
  | "REFURBISHING"
  | "READY_FOR_SALE"
  | "LISTED"
  | "RESERVED"
  | "SOLD"
  | "WARRANTY";

export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC";
export type Transmission = "MANUAL" | "AUTOMATIC" | "CVT";

export interface VehicleMedia {
  id: number;
  file: string;
  media_type: "IMAGE" | "VIDEO";
  is_primary: boolean;
  caption: string;
  display_order: number;
}

export interface VehicleSpec {
  id: number;
  body_type: string;
  body_type_display: string;
  engine_capacity: number | null;
  horsepower: number | null;
  doors: number;
  seats: number;
  origin: string;
  origin_display: string;
  has_abs: boolean;
  has_airbags: boolean;
  airbag_count: number;
  has_camera: boolean;
  has_360_camera: boolean;
  has_sunroof: boolean;
  tire_condition: string;
  brake_condition: string;
  engine_condition: string;
  electrical_condition: string;
}

export interface VehicleStatusLog {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: number;
  changed_by_name: string;
  note: string;
  changed_at: string;
}

export interface Vehicle {
  id: number;
  vin: string;
  brand: string;
  model: string;
  variant: string;
  year: string;
  mileage: string;
  color: string;
  fuel_type: FuelType;
  fuel_type_display: string;
  transmission: Transmission;
  transmission_display: string;
  sale_price: string;
  status: VehicleStatus;
  status_display: string;
  thumbnail: string | null;
  created_at: string;
}

export interface VehicleDetail extends Vehicle {
  license_plate: string;
  purchase_price: string | null;
  purchase_date: string | null;
  purchase_note: string;
  description: string;
  spec: VehicleSpec | null;
  media: VehicleMedia[];
  status_logs: VehicleStatusLog[];
  created_by: number;
  created_by_name: string;
  updated_at: string;
}

export interface VehicleFilters {
  search?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  year?: string;
  status?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface VehicleListResponse {
  results: Vehicle[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface VehicleFormData {
  vin: string;
  license_plate?: string;
  brand: string;
  model: string;
  variant?: string;
  year: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  color?: string;
  body_type?: string;
  purchase_price?: string;
  purchase_date?: string;
  purchase_note?: string;
  sale_price?: string;
  description?: string;
  status?: string;
}

export interface VehicleFormErrors {
  vin?: string;
  brand?: string;
  model?: string;
  year?: string;
  mileage?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  sale_price?: string;
}

// ── Constants ──────────────────────────────────────────────────

export const EMPTY_VEHICLE_FORM: VehicleFormData = {
  vin: "",
  license_plate: "",
  brand: "",
  model: "",
  variant: "",
  year: "",
  mileage: "",
  fuel_type: "",
  transmission: "",
  color: "",
  body_type: "",
  purchase_price: "",
  purchase_date: "",
  purchase_note: "",
  sale_price: "",
  description: "",
  status: "PURCHASED",
};

export const BRANDS = [
  "Toyota", "Mazda", "Honda", "Hyundai", "KIA",
  "Ford", "Nissan", "Vinfast", "BMW", "Audi",
  "Mercedes Benz", "Volvo", "Peugeot", "Mitsubishi",
  "Chevrolet", "Suzuki", "Lexus", "Subaru",
];
export const BODY_TYPES = [
  { value: "SEDAN",     label: "Sedan"     },
  { value: "SUV",       label: "SUV"       },
  { value: "CUV",       label: "CUV"       },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "MPV",       label: "MPV"       },
  { value: "PICKUP",    label: "Bán tải"   },
  { value: "COUPE",     label: "Coupe"     },
  { value: "CROSSOVER", label: "Crossover" },
];
export const FUEL_TYPES = [
  { value: "GASOLINE", label: "Xăng"   },
  { value: "DIESEL",   label: "Dầu"    },
  { value: "HYBRID",   label: "Hybrid" },
  { value: "ELECTRIC", label: "Điện"   },
];

export const TRANSMISSIONS = [
  { value: "MANUAL",    label: "Số sàn"     },
  { value: "AUTOMATIC", label: "Số tự động" },
  { value: "CVT",       label: "CVT"        },
];

export const STATUSES = [
  { value: "PURCHASED",       label: "Mới nhập"         },
  { value: "WAIT_INSPECTION", label: "Chờ kiểm định"    },
  { value: "INSPECTING",      label: "Đang kiểm định"   },
  { value: "INSPECTED",       label: "Đã kiểm định"     },
  { value: "WAIT_REFURBISH",  label: "Chờ tân trang"    },
  { value: "REFURBISHING",    label: "Đang tân trang"   },
  { value: "READY_FOR_SALE",  label: "Sẵn sàng bán"     },
  { value: "LISTED",          label: "Đang đăng bán"    },
  { value: "RESERVED",        label: "Đã đặt cọc"       },
  { value: "SOLD",            label: "Đã bán"           },
  { value: "WARRANTY",        label: "Đang bảo hành"    },
];

// ── Validator ──────────────────────────────────────────────────

export function validateVehicleForm(form: VehicleFormData): VehicleFormErrors {
  const e: VehicleFormErrors = {};

  if (!form.vin.trim())   e.vin   = "Vui lòng nhập số khung (VIN)";
  if (!form.brand)        e.brand = "Vui lòng chọn hãng xe";
  if (!form.model.trim()) e.model = "Vui lòng nhập dòng xe";
  if (!form.sale_price || Number(form.sale_price) <= 0) {
  e.sale_price = "Vui lòng nhập giá bán";
}
  if (!form.year) {
    e.year = "Vui lòng nhập năm sản xuất";
  } else if (
    Number(form.year) < 1990 ||
    Number(form.year) > new Date().getFullYear() + 1
  ) {
    e.year = "Năm sản xuất không hợp lệ";
  }

  if (!form.mileage) {
    e.mileage = "Vui lòng nhập số km";
  } else if (Number(form.mileage) < 0) {
    e.mileage = "Số km không hợp lệ";
  }

  if (!form.fuel_type)    e.fuel_type    = "Vui lòng chọn loại nhiên liệu";
  if (!form.transmission) e.transmission = "Vui lòng chọn hộp số";

  if (form.sale_price && Number(form.sale_price) <= 0) {
    e.sale_price = "Giá bán không hợp lệ";
  }

  return e;
}

// ── API calls ──────────────────────────────────────────────────

/** Danh sách xe đang niêm yết — công khai */
export async function getVehicles(
  params: VehicleFilters
): Promise<VehicleListResponse> {
  const res = await api.get("/vehicles/", { params });
  return res.data;
}

/** Danh sách toàn bộ xe — nội bộ */
export async function getVehiclesAdmin(
  params: VehicleFilters
): Promise<VehicleListResponse> {
  const res = await api.get("/admin/vehicles/", { params });
  return res.data;
}

/** Chi tiết xe */
export async function getVehicleDetail(id: number | string): Promise<VehicleDetail> {
  const res = await api.get(`/vehicles/${id}/`);
  return res.data;
}

/** Chi tiết xe — dùng trong admin (alias) */
export const getVehicleAdminDetail = getVehicleDetail;

/** Tạo xe mới */
/** Tạo xe mới — gửi JSON cho text fields, upload ảnh riêng */
export async function createVehicleApi(
  formData: VehicleFormData
): Promise<VehicleDetail> {
  try {
    // Bước 1: Gửi text fields dưới dạng JSON
    const payload: Record<string, string> = {};
    (Object.keys(formData) as (keyof VehicleFormData)[]).forEach((key) => {
      const val = formData[key];
      if (val !== undefined && val !== null && val !== "") {
        payload[key] = String(val);
      }
    });

    const res = await api.post("/admin/vehicles/create/", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    console.error("Lỗi tạo xe:", error.response?.data);

    // Lấy thông báo lỗi từ Django validation
    const data = error.response?.data as Record<string, string[]> | undefined;
    if (data) {
      const firstField = Object.keys(data)[0];
      const firstMsg   = data[firstField]?.[0];
      if (firstMsg) throw new Error(`${firstField}: ${firstMsg}`);
    }

    throw new Error("Không thể tạo xe. Vui lòng kiểm tra lại thông tin.");
  }
}
/** Cập nhật xe */
/** Cập nhật xe */
export async function updateVehicleApi(
  id: number,
  form: VehicleFormData
): Promise<VehicleDetail> {
  try {
    const payload: Record<string, string> = {};
    (Object.keys(form) as (keyof VehicleFormData)[]).forEach((key) => {
      const val = form[key];
      if (val !== undefined && val !== null && val !== "") {
        payload[key] = String(val);
      }
    });

    const res = await api.patch(`/admin/vehicles/${id}/`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    console.error("Lỗi cập nhật xe:", error.response?.data);

    const data = error.response?.data as Record<string, string[]> | undefined;
    if (data) {
      const firstField = Object.keys(data)[0];
      const firstMsg   = data[firstField]?.[0];
      if (firstMsg) throw new Error(`${firstField}: ${firstMsg}`);
    }

    throw new Error("Không thể cập nhật xe. Vui lòng kiểm tra lại thông tin.");
  }
}

/** Upload media xe */
export async function uploadVehicleMedia(
  vehicleId: number,
  files: File[]
): Promise<VehicleMedia[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await api.post(`/admin/vehicles/${vehicleId}/media/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.media;
}

/** Xóa một ảnh xe */
export async function deleteVehicleImageApi(
  vehicleId: number,
  mediaId: number
): Promise<void> {
  try {
    await api.delete(`/admin/vehicles/${vehicleId}/media/${mediaId}/`);
  } catch (err) {
    const error = err as AxiosError;
    console.error("Lỗi xóa ảnh:", error.response?.data);
    throw new Error(
      (error.response?.data as any)?.detail ?? "Không thể xóa ảnh. Vui lòng thử lại."
    );
  }
}

/** Danh sách trạng thái xe */
export async function getVehicleStatusChoices(): Promise<
  { value: string; label: string }[]
> {
  const res = await api.get("/vehicles/status-choices/");
  return res.data;
}