import { AxiosError } from "axios";
import api from "./client";
import type { Deposit, DepositPayload } from "./sales";

// Re-export để các component cũ không bị lỗi import
export type { Deposit as DepositResponse };
export type { DepositPayload };

// ── Error helper ───────────────────────────────────────────────

export interface ApiFieldError {
  [field: string]: string[];
}
export interface DepositListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}

export interface DepositListResponse {
  results: Deposit[];
  count: number;
  next: string | null;
  previous: string | null;
}
function extractErrorMessage(err: AxiosError): string {
  const data = err.response?.data as any;
  if (!data) return "Đã xảy ra lỗi không xác định.";

  // Django REST trả về { detail: "..." }
  if (typeof data.detail === "string") return data.detail;

  // Django REST trả về field errors { field: ["msg"] }
  const firstField = Object.values(data)[0];
  if (Array.isArray(firstField) && firstField.length > 0) {
    return String(firstField[0]);
  }

  return "Đã xảy ra lỗi, vui lòng thử lại.";
}

// ── API calls ──────────────────────────────────────────────────

/**
 * Tạo đặt cọc mới.
 * Tương ứng: POST /api/deposits/
 */
export async function createDeposit(data: DepositPayload): Promise<Deposit> {
  try {
    const res = await api.post("/deposits/", data);
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    const message = extractErrorMessage(error);
    console.error("Lỗi tạo đặt cọc:", error.response?.data);
    throw new Error(message);
  }
}

/**
 * Lấy danh sách đặt cọc.
 * - Khách hàng: chỉ thấy đặt cọc của mình.
 * - Nhân viên bán hàng / admin: thấy tất cả.
 * Tương ứng: GET /api/deposits/
 */
export async function getDeposits(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}): Promise<Deposit[]> {
  const res = await api.get("/deposits/", { params });

  // Backend trả về array trực tiếp
  if (Array.isArray(res.data)) return res.data;

  // Backend trả về pagination
  return res.data.results ?? res.data;
}

/**
 * Chi tiết một đơn đặt cọc.
 * Tương ứng: GET /api/deposits/:id/
 */
export async function getDepositDetail(id: number): Promise<Deposit> {
  try {
    const res = await api.get(`/deposits/${id}/`);
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    console.error("Lỗi tải chi tiết đặt cọc:", error.response?.data);
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Xác nhận đặt cọc — khóa xe, chuyển xe sang trạng thái RESERVED.
 * Chỉ nhân viên bán hàng / admin.
 * Tương ứng: POST /api/deposits/:id/confirm/
 */
export async function confirmDeposit(
  id: number
): Promise<{ message: string }> {
  try {
    const res = await api.post(`/deposits/${id}/confirm/`);
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    console.error("Lỗi xác nhận đặt cọc:", error.response?.data);
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Hủy đặt cọc.
 * Nếu đặt cọc đang CONFIRMED → tự động trả xe về trạng thái LISTED.
 * Tương ứng: POST /api/deposits/:id/cancel/
 */
export async function cancelDeposit(
  id: number
): Promise<{ message: string }> {
  try {
    const res = await api.post(`/deposits/${id}/cancel/`);
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    console.error("Lỗi hủy đặt cọc:", error.response?.data);
    throw new Error(extractErrorMessage(error));
  }
}
