import { AxiosError } from "axios";
import api from "./client";
import type { VehicleDetail } from "./vehicles";

// Re-export kiểu để các component import từ đây vẫn hoạt động
export type { VehicleDetail };

// ── Error helper ───────────────────────────────────────────────

function extractErrorMessage(err: AxiosError): string {
  const data = err.response?.data as any;
  if (!data) return "Đã xảy ra lỗi không xác định.";
  if (typeof data.detail === "string") return data.detail;
  return "Đã xảy ra lỗi, vui lòng thử lại.";
}

// ── API calls ──────────────────────────────────────────────────

/**
 * Chi tiết xe — dùng ở trang VehicleDetailPage (public).
 * - Xe đang LISTED: trả về đầy đủ thông tin công khai.
 * - Xe ở trạng thái khác: cần đăng nhập nội bộ (BE tự xử lý phân quyền).
 * Tương ứng: GET /api/vehicles/:id/
 */
export async function getVehicleDetail(
  id: number | string
): Promise<VehicleDetail> {
  try {
    const res = await api.get(`/vehicles/${id}/`);
    return res.data;
  } catch (err) {
    const error = err as AxiosError;

    if (error.response?.status === 404) {
      throw new Error("Không tìm thấy xe hoặc xe đã được bán.");
    }

    if (error.response?.status === 403) {
      throw new Error("Bạn không có quyền xem thông tin xe này.");
    }

    console.error("Lỗi tải chi tiết xe:", error.response?.data);
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Hồ sơ kiểm định công khai của xe — hiển thị cho khách hàng.
 * Chỉ trả về phiếu is_public=True và status=COMPLETED.
 * Tương ứng: GET /api/inspections/public/:inspectionId/
 */
export async function getVehiclePublicInspection(
  inspectionId: number
): Promise<any> {
  try {
    const res = await api.get(`/inspections/public/${inspectionId}/`);
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    console.error("Lỗi tải hồ sơ kiểm định:", error.response?.data);
    throw new Error(extractErrorMessage(error));
  }
}