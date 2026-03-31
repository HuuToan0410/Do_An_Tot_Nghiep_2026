// src/api/appointments.ts
import api from "./client";

// ── Types ──────────────────────────────────────────────────────

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id:               number;
  vehicle:          number;
  vehicle_name:     string;
  customer:         number | null;
  customer_name:    string;
  customer_phone:   string;
  customer_email:   string;
  scheduled_at:     string;   // ISO datetime
  status:           AppointmentStatus;
  status_display:   string;
  note:             string;
  handled_by:       number | null;
  handled_by_name:  string | null;
  created_at:       string;
}

export interface CreateAppointmentPayload {
  vehicle:         number;
  customer_name:   string;
  customer_phone:  string;
  customer_email?: string;
  scheduled_at:    string;   // ISO datetime: "2026-04-01T10:00:00"
  note?:           string;
}

export interface UpdateAppointmentPayload {
  status?:         AppointmentStatus;
  note?:           string;
  scheduled_at?:   string;
}

// ── Constants ──────────────────────────────────────────────────

export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  PENDING:   { label: "Chờ xác nhận", color: "text-yellow-700", bg: "bg-yellow-100", dot: "bg-yellow-400" },
  CONFIRMED: { label: "Đã xác nhận",  color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500"   },
  COMPLETED: { label: "Đã xem xe",    color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500"  },
  CANCELLED: { label: "Đã hủy",       color: "text-gray-600",   bg: "bg-gray-100",   dot: "bg-gray-400"   },
  NO_SHOW:   { label: "Không đến",    color: "text-red-700",    bg: "bg-red-100",    dot: "bg-red-500"    },
};

// ── Helpers ────────────────────────────────────────────────────

/** Format datetime ISO sang dạng "14:30 - 01/04/2026" */
export function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("vi-VN");
  return `${time} - ${date}`;
}

/** Trả về datetime-local string cho input: "2026-04-01T10:00" */
export function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

// ── API calls ──────────────────────────────────────────────────

/** Danh sách lịch hẹn — nhân viên thấy tất cả, khách chỉ thấy của mình */
export async function getAppointments(params?: {
  vehicle?:  number;
  status?:   string;
}): Promise<Appointment[]> {
  const res = await api.get("/appointments/", { params });
  return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
}

/** Chi tiết lịch hẹn */
export async function getAppointmentDetail(id: number): Promise<Appointment> {
  const res = await api.get(`/appointments/${id}/`);
  return res.data;
}

/** Khách tạo lịch hẹn xem xe — yêu cầu đăng nhập */
export async function createAppointment(
  data: CreateAppointmentPayload
): Promise<Appointment> {
  const res = await api.post("/appointments/", data);
  return res.data;
}

/** Nhân viên cập nhật trạng thái lịch hẹn */
export async function updateAppointment(
  id:   number,
  data: UpdateAppointmentPayload
): Promise<Appointment> {
  const res = await api.patch(`/appointments/${id}/`, data);
  return res.data;
}