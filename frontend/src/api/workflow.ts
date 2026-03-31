import api from "./client";
import type { VehicleStatus } from "./vehicles";

// ── Types ──────────────────────────────────────────────────────

export type { VehicleStatus as VehicleWorkflowStatus };

/** Action gửi lên endpoint /transition/ */
export type WorkflowAction =
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

export interface WorkflowTransitionPayload {
  new_status: WorkflowAction;
  note?: string;
}

export interface WorkflowTransitionResponse {
  message: string;
  status: VehicleStatus;
}

// ── Status config ──────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; style: string }
> = {
  PURCHASED:      { label: "Mới nhập",        style: "bg-gray-100    text-gray-700"   },
  WAIT_INSPECTION:{ label: "Chờ kiểm định",   style: "bg-yellow-100  text-yellow-700" },
  INSPECTING:     { label: "Đang kiểm định",  style: "bg-orange-100  text-orange-700" },
  INSPECTED:      { label: "Đã kiểm định",    style: "bg-sky-100     text-sky-700"    },
  WAIT_REFURBISH: { label: "Chờ tân trang",   style: "bg-pink-100    text-pink-700"   },
  REFURBISHING:   { label: "Đang tân trang",  style: "bg-violet-100  text-violet-700" },
  READY_FOR_SALE: { label: "Sẵn sàng bán",   style: "bg-blue-100    text-blue-700"   },
  LISTED:         { label: "Đang đăng bán",   style: "bg-green-100   text-green-700"  },
  RESERVED:       { label: "Đã giữ chỗ",      style: "bg-purple-100  text-purple-700" },
  SOLD:           { label: "Đã bán",          style: "bg-red-100     text-red-700"    },
  WARRANTY:       { label: "Đang bảo hành",   style: "bg-teal-100    text-teal-700"   },
};

// Các bước chuyển trạng thái hợp lệ
export const WORKFLOW_TRANSITIONS: Record<
  VehicleStatus,
  { new_status: WorkflowAction; label: string; color: "blue" | "green" | "red" | "gray" }[]
> = {
  PURCHASED:      [{ new_status: "WAIT_INSPECTION", label: "Gửi kiểm định",    color: "blue"  }],
  WAIT_INSPECTION:[{ new_status: "INSPECTING",      label: "Bắt đầu kiểm định",color: "blue"  }],
  INSPECTING:     [
    { new_status: "INSPECTED",      label: "Kiểm định đạt",    color: "green" },
    { new_status: "WAIT_INSPECTION",label: "Kiểm định lại",    color: "gray"  },
  ],
  INSPECTED:      [
    { new_status: "WAIT_REFURBISH", label: "Gửi tân trang",    color: "blue"  },
    { new_status: "READY_FOR_SALE", label: "Sẵn sàng bán",     color: "green" },
  ],
  WAIT_REFURBISH: [{ new_status: "REFURBISHING",    label: "Bắt đầu tân trang",color: "blue"  }],
  REFURBISHING:   [{ new_status: "READY_FOR_SALE",  label: "Hoàn thành tân trang",color:"green"}],
  READY_FOR_SALE: [{ new_status: "LISTED",           label: "Đăng bán",         color: "green" }],
  LISTED:         [
    { new_status: "RESERVED",       label: "Đặt cọc",          color: "blue"  },
    { new_status: "READY_FOR_SALE", label: "Gỡ niêm yết",      color: "gray"  },
  ],
  RESERVED:       [
    { new_status: "SOLD",           label: "Xác nhận bán",     color: "green" },
    { new_status: "LISTED",         label: "Hủy đặt cọc",      color: "red"   },
  ],
  SOLD:           [{ new_status: "WARRANTY",        label: "Kích hoạt bảo hành",color:"blue"  }],
  WARRANTY:       [],
};

// ── API call ───────────────────────────────────────────────────

export async function vehicleTransition(
  vehicleId: number,
  payload: WorkflowTransitionPayload
): Promise<WorkflowTransitionResponse> {
  const res = await api.post(
    `/admin/vehicles/${vehicleId}/transition/`,
    payload
  );
  return res.data;
}