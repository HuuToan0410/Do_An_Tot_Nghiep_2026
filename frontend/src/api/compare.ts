// So sánh xe dùng lại API đã có — không cần endpoint mới
export { getVehicleDetail } from "./vehicleDetail";
export type { VehicleDetail } from "./vehicles";

// ── Constants ──────────────────────────────────────────────────

export const MAX_COMPARE = 3; // Tối đa 3 xe

export const COMPARE_SPECS = [
  // Thông tin cơ bản
  { key: "year",         label: "Năm sản xuất",   group: "Thông tin"  },
  { key: "mileage",      label: "Số km đã đi",    group: "Thông tin"  },
  { key: "color",        label: "Màu sắc",         group: "Thông tin"  },
  { key: "sale_price",   label: "Giá bán",         group: "Thông tin"  },
  // Kỹ thuật
  { key: "fuel_type_display",       label: "Nhiên liệu",    group: "Kỹ thuật" },
  { key: "transmission_display",    label: "Hộp số",        group: "Kỹ thuật" },
  // Spec
  { key: "spec.body_type_display",  label: "Kiểu dáng",     group: "Kỹ thuật" },
  { key: "spec.engine_capacity",    label: "Dung tích",     group: "Kỹ thuật" },
  { key: "spec.seats",              label: "Số chỗ",        group: "Kỹ thuật" },
  { key: "spec.doors",              label: "Số cửa",        group: "Kỹ thuật" },
  { key: "spec.origin_display",     label: "Xuất xứ",       group: "Kỹ thuật" },
  // An toàn
  { key: "spec.has_abs",            label: "ABS",           group: "An toàn"  },
  { key: "spec.has_airbags",        label: "Túi khí",       group: "An toàn"  },
  { key: "spec.airbag_count",       label: "Số túi khí",    group: "An toàn"  },
  { key: "spec.has_camera",         label: "Camera lùi",    group: "An toàn"  },
  { key: "spec.has_360_camera",     label: "Camera 360°",   group: "An toàn"  },
  { key: "spec.has_sunroof",        label: "Cửa sổ trời",   group: "An toàn"  },
  // Tình trạng
  { key: "spec.engine_condition",    label: "Động cơ",      group: "Tình trạng" },
  { key: "spec.brake_condition",     label: "Phanh",        group: "Tình trạng" },
  { key: "spec.tire_condition",      label: "Lốp xe",       group: "Tình trạng" },
  { key: "spec.electrical_condition",label: "Hệ thống điện",group: "Tình trạng" },
] as const;

// ── Helpers ────────────────────────────────────────────────────

export function getNestedValue(obj: any, key: string): any {
  return key.split(".").reduce((acc, k) => acc?.[k], obj);
}

export function formatCompareValue(key: string, value: any): string {
  if (value === null || value === undefined || value === "") return "—";

  // Boolean
  if (typeof value === "boolean") return value ? "✓ Có" : "✗ Không";

  // Price
  if (key === "sale_price") {
    const num = Number(value);
    if (!num) return "Liên hệ";
    const ty    = Math.floor(num / 1_000_000_000);
    const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
    if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Triệu`;
    if (ty > 0)              return `${ty} Tỷ`;
    return `${trieu} Triệu`;
  }

  // Mileage
  if (key === "mileage") {
    return `${Number(value).toLocaleString("vi-VN")} km`;
  }

  // Engine capacity
  if (key === "spec.engine_capacity") return `${value}L`;

  // Seats / doors
  if (key === "spec.seats") return `${value} chỗ`;
  if (key === "spec.doors") return `${value} cửa`;

  return String(value);
}

export function isBestValue(
  key: string,
  value: any,
  allValues: any[]
): boolean {
  const numericBest: Record<string, "min" | "max"> = {
    sale_price:            "min",  // giá thấp nhất là tốt nhất
    mileage:               "min",  // km ít nhất
    "spec.airbag_count":   "max",  // túi khí nhiều nhất
    "spec.engine_capacity":"max",  // dung tích lớn
    "spec.seats":          "max",  // nhiều chỗ
  };

  const direction = numericBest[key];
  if (!direction) return false;

  const nums = allValues.map(Number).filter((n) => !isNaN(n) && n > 0);
  if (nums.length < 2) return false;

  const num = Number(value);
  if (isNaN(num) || num <= 0) return false;

  return direction === "min"
    ? num === Math.min(...nums)
    : num === Math.max(...nums);
}