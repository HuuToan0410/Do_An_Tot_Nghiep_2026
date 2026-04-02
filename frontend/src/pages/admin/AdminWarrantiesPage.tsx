// src/pages/admin/AdminWarrantiesPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Search,
  Calendar,
  Car,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Eye,
  Wrench,
  ClipboardList,
  Star,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api/client";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 15;

function daysUntilExpiry(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function extractErrorMessage(e: any): string {
  const data = e?.response?.data;
  if (!data) return "Có lỗi xảy ra khi kết nối máy chủ.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (data.sales_order) {
    const v = data.sales_order;
    return Array.isArray(v) ? v[0] : String(v);
  }
  const first = Object.values(data).flat()[0];
  return first ? String(first) : "Có lỗi xảy ra. Kiểm tra lại thông tin.";
}

// ── Section: Thông tin xe từ API ───────────────────────────
function VehicleInfoSection({ vehicleId }: { vehicleId: number }) {
  // GET /api/vehicles/<id>/ — VehicleDetailSerializer
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicleDetail", vehicleId],
    queryFn: async () => {
      const res = await api.get(`/vehicles/${vehicleId}/`);
      return res.data;
    },
    enabled: !!vehicleId,
  });

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 size={12} className="animate-spin" /> Đang tải thông tin xe...
      </div>
    );
  if (!vehicle) return null;

  const spec = vehicle.spec;
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Car size={15} className="text-blue-600" />
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
          Thông tin xe
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Xe</p>
          <p className="font-semibold text-gray-800">
            {vehicle.brand} {vehicle.model} {vehicle.variant || ""}{" "}
            {vehicle.year || ""}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Màu sắc</p>
          <p className="font-semibold text-gray-800">{vehicle.color || "—"}</p>
        </div>
        <div>
          <p className="text-gray-400">Biển số</p>
          <p className="font-semibold text-gray-800">
            {vehicle.license_plate || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-400">VIN</p>
          <p className="font-mono text-gray-700 break-all">
            {vehicle.vin || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Số km</p>
          <p className="font-semibold text-gray-800">
            {vehicle.mileage
              ? `${Number(vehicle.mileage).toLocaleString("vi-VN")} km`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Nhiên liệu / Hộp số</p>
          <p className="font-semibold text-gray-800">
            {vehicle.fuel_type_display || ""} /{" "}
            {vehicle.transmission_display || "—"}
          </p>
        </div>
        {spec && (
          <>
            <div>
              <p className="text-gray-400">Tình trạng động cơ</p>
              <p className="font-semibold text-gray-800">
                {spec.engine_condition || "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Tình trạng thân xe</p>
              <p className="font-semibold text-gray-800">
                {spec.brake_condition || "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Tình trạng lốp</p>
              <p className="font-semibold text-gray-800">
                {spec.tire_condition || "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Hệ thống điện</p>
              <p className="font-semibold text-gray-800">
                {spec.electrical_condition || "—"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Section: Kiểm định từ API ───────────────────────────────
function InspectionSection({ vehicleId }: { vehicleId: number }) {
  const [expanded, setExpanded] = useState(false);

  // GET /api/inspections/?vehicle=<id> — InspectionListSerializer
  const { data, isLoading } = useQuery({
    queryKey: ["inspections", vehicleId],
    queryFn: async () => {
      const res = await api.get("/inspections/", {
        params: { vehicle: vehicleId },
      });
      return res.data;
    },
    enabled: !!vehicleId,
  });

  const inspections: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const latest = inspections[0]; // mới nhất

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 size={12} className="animate-spin" /> Đang tải kiểm định...
      </div>
    );
  if (inspections.length === 0)
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={14} className="text-gray-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Kiểm định
          </p>
        </div>
        <p className="text-xs text-gray-400">Chưa có phiếu kiểm định nào.</p>
      </div>
    );

  const gradeColor: Record<string, string> = {
    A: "bg-green-100 text-green-700",
    B: "bg-blue-100 text-blue-700",
    C: "bg-yellow-100 text-yellow-700",
    D: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={15} className="text-green-600" />
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
            Kiểm định ({inspections.length} phiếu)
          </p>
        </div>
        {inspections.length > 1 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-green-600 flex items-center gap-0.5"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} /> Thu gọn
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Xem thêm
              </>
            )}
          </button>
        )}
      </div>

      {/* Luôn hiện phiếu mới nhất */}
      <InspectionCard inspection={latest} gradeColor={gradeColor} />

      {/* Hiện thêm nếu expand */}
      {expanded &&
        inspections
          .slice(1)
          .map((ins: any) => (
            <InspectionCard
              key={ins.id}
              inspection={ins}
              gradeColor={gradeColor}
            />
          ))}
    </div>
  );
}

function InspectionCard({
  inspection: ins,
  gradeColor,
}: {
  inspection: any;
  gradeColor: Record<string, string>;
}) {
  return (
    <div className="bg-white rounded-lg p-3 space-y-2 border border-green-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {ins.quality_grade && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor[ins.quality_grade] ?? "bg-gray-100 text-gray-600"}`}
            >
              Hạng {ins.quality_grade}
            </span>
          )}
          <span className="text-xs text-gray-500">{ins.status_display}</span>
        </div>
        {ins.overall_score != null && (
          <div className="flex items-center gap-1">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-700">
              {ins.overall_score}/10
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div>
          <span className="text-gray-400">KTV: </span>
          <span className="font-medium text-gray-700">
            {ins.inspector_name || "—"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Ngày: </span>
          <span className="font-medium text-gray-700">
            {ins.inspection_date
              ? new Date(ins.inspection_date).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        </div>
      </div>
      {ins.conclusion && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 leading-relaxed">
          <span className="font-semibold">Kết luận:</span> {ins.conclusion}
        </p>
      )}
      {ins.recommendation && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 leading-relaxed">
          <span className="font-semibold">Khuyến nghị:</span>{" "}
          {ins.recommendation}
        </p>
      )}
    </div>
  );
}

// ── Section: Tân trang từ API ───────────────────────────────
function RefurbishmentSection({ vehicleId }: { vehicleId: number }) {
  const [expanded, setExpanded] = useState(false);

  // GET /api/refurbishments/?vehicle=<id> — RefurbishmentListSerializer
  const { data, isLoading } = useQuery({
    queryKey: ["refurbishments", vehicleId],
    queryFn: async () => {
      const res = await api.get("/refurbishments/", {
        params: { vehicle: vehicleId },
      });
      return res.data;
    },
    enabled: !!vehicleId,
  });

  const orders: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const latest = orders[0];

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <Loader2 size={12} className="animate-spin" /> Đang tải tân trang...
      </div>
    );
  if (orders.length === 0)
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <Wrench size={14} className="text-gray-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Tân trang / Sửa chữa
          </p>
        </div>
        <p className="text-xs text-gray-400">Chưa có lệnh tân trang nào.</p>
      </div>
    );

  const totalCost = orders.reduce(
    (sum, o) => sum + Number(o.total_cost || 0),
    0,
  );

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={15} className="text-orange-600" />
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">
            Tân trang / Sửa chữa ({orders.length} lệnh)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-orange-600 font-semibold">
            <DollarSign size={11} />
            Tổng: {totalCost.toLocaleString("vi-VN")} đ
          </div>
          {orders.length > 1 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-orange-600 flex items-center gap-0.5"
            >
              {expanded ? (
                <>
                  <ChevronUp size={12} /> Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown size={12} /> Xem thêm
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <RefurbishmentCard order={latest} />
      {expanded &&
        orders
          .slice(1)
          .map((o: any) => <RefurbishmentCard key={o.id} order={o} />)}
    </div>
  );
}

function RefurbishmentCard({ order }: { order: any }) {
  // GET /api/refurbishments/<id>/ để lấy items nếu cần
  const { data: detail } = useQuery({
    queryKey: ["refurbishmentDetail", order.id],
    queryFn: async () => {
      const res = await api.get(`/refurbishments/${order.id}/`);
      return res.data;
    },
    enabled: !!order.id,
  });

  const items: any[] = detail?.items ?? [];

  return (
    <div className="bg-white rounded-lg p-3 space-y-2 border border-orange-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              order.status_display === "Hoàn thành" ||
              order.status === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : order.status === "CANCELLED"
                  ? "bg-red-100 text-red-600"
                  : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {order.status_display || order.status}
          </span>
        </div>
        <span className="text-xs font-bold text-orange-600">
          {Number(order.total_cost || 0).toLocaleString("vi-VN")} đ
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div>
          <span className="text-gray-400">KTV: </span>
          <span className="font-medium text-gray-700">
            {order.technician_name || "—"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Bắt đầu: </span>
          <span className="font-medium text-gray-700">
            {order.start_date
              ? new Date(order.start_date).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Hoàn thành: </span>
          <span className="font-medium text-gray-700">
            {order.completed_date
              ? new Date(order.completed_date).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        </div>
      </div>

      {/* Chi tiết hạng mục từ RefurbishmentDetailSerializer */}
      {items.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-semibold text-gray-500">
            Hạng mục ({items.length}):
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.is_completed ? "bg-green-400" : "bg-yellow-400"}`}
                  />
                  <span className="text-gray-700 truncate">{item.name}</span>
                  {item.item_type_display && (
                    <span className="text-gray-400 shrink-0">
                      ({item.item_type_display})
                    </span>
                  )}
                </div>
                <span className="text-gray-500 shrink-0 ml-2 font-medium">
                  {Number(item.cost || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Panel hiển thị thông tin xe khi nhập sales_order ID ────
function VehiclePreviewPanel({ salesOrderId }: { salesOrderId: string }) {
  const soId = Number(salesOrderId);

  // Bước 1: lấy đơn bán → vehicle ID
  const {
    data: order,
    isLoading: loadingOrder,
    isError: errOrder,
  } = useQuery({
    queryKey: ["salesOrder", soId],
    queryFn: async () => {
      const res = await api.get(`/sales-orders/${soId}/`);
      return res.data;
    },
    enabled: !!soId && soId > 0,
  });

  if (!soId || soId <= 0) return null;

  if (loadingOrder)
    return (
      <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-2 text-xs text-gray-400">
        <Loader2 size={14} className="animate-spin text-blue-500" />
        Đang tải thông tin đơn bán #{soId}...
      </div>
    );

  if (errOrder)
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2">
        <AlertCircle size={13} />
        Không tìm thấy đơn bán #{soId}. Kiểm tra lại ID.
      </div>
    );

  if (!order) return null;

  const vehicleId: number = order.vehicle;

  return (
    <div className="space-y-3 mt-1">
      {/* Header đơn bán */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Thông tin đơn bán #{soId}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Khách hàng: </span>
            <span className="font-semibold text-gray-800">
              {order.customer_name || "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">SĐT: </span>
            <span className="font-semibold text-gray-800">
              {order.customer_phone || "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Hợp đồng: </span>
            <span className="font-mono text-gray-700">
              {order.contract_number || "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Giá bán: </span>
            <span className="font-bold text-red-600">
              {order.sale_price
                ? Number(order.sale_price).toLocaleString("vi-VN") + " đ"
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Thông tin xe */}
      <VehicleInfoSection vehicleId={vehicleId} />

      {/* Kiểm định */}
      <InspectionSection vehicleId={vehicleId} />

      {/* Tân trang */}
      <RefurbishmentSection vehicleId={vehicleId} />
    </div>
  );
}

// ── Modal tạo bảo hành mới ──────────────────────────────────
interface WarrantyForm {
  sales_order: string;
  warranty_months: string;
  max_mileage: string;
  coverage_note: string;
  start_date: string;
  end_date: string;
  status: string;
}

function CreateWarrantyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<WarrantyForm>({
    sales_order: "",
    warranty_months: "6",
    max_mileage: "10000",
    coverage_note: "",
    start_date: "",
    end_date: "",
    status: "ACTIVE",
  });
  const [error, setError] = useState("");

  function calcEndDate(startDate: string, months: string): string {
    if (!startDate || !months || isNaN(Number(months))) return "";
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + Number(months));
    return d.toISOString().split("T")[0];
  }

  function handleChange(field: keyof WarrantyForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "start_date" || field === "warranty_months") {
        const sd = field === "start_date" ? value : prev.start_date;
        const wm = field === "warranty_months" ? value : prev.warranty_months;
        next.end_date = calcEndDate(sd, wm);
      }
      return next;
    });
    setError("");
  }

  const mut = useMutation({
    mutationFn: async () => {
      const res = await api.post("/warranties/", {
        sales_order: Number(form.sales_order),
        warranty_months: Number(form.warranty_months),
        max_mileage: Number(form.max_mileage),
        coverage_note: form.coverage_note.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
      });
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e: any) => setError(extractErrorMessage(e)),
  });

  const ic =
    "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100";
  const canSubmit =
    !!form.sales_order &&
    !!form.start_date &&
    !!form.end_date &&
    !mut.isPending;
  // Debounce nhẹ: chỉ load preview khi sales_order >= 1
  const showPreview = Number(form.sales_order) >= 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-bold text-gray-900">Tạo hồ sơ bảo hành mới</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Cột trái: Form nhập */}
          <div className="flex-1 p-6 space-y-4 border-r border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Thông tin bảo hành
            </p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                ID Đơn bán hàng *
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ví dụ: 42"
                value={form.sales_order}
                onChange={(e) => handleChange("sales_order", e.target.value)}
                className={ic}
              />
              <p className="text-xs text-gray-400 mt-1">
                ID số nguyên — xem ở trang <strong>Đơn bán hàng</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Thời hạn (tháng) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.warranty_months}
                  onChange={(e) =>
                    handleChange("warranty_months", e.target.value)
                  }
                  className={ic}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Số km tối đa *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.max_mileage}
                  onChange={(e) => handleChange("max_mileage", e.target.value)}
                  className={ic}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className={ic}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                  className={ic}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Tự tính theo số tháng
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className={ic}
              >
                <option value="ACTIVE">Đang bảo hành</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="VOID">Đã hủy</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Nội dung bảo hành
              </label>
              <textarea
                rows={3}
                placeholder="Mô tả phạm vi bảo hành (động cơ, hộp số, ...)"
                value={form.coverage_note}
                onChange={(e) => handleChange("coverage_note", e.target.value)}
                className={ic + " resize-none"}
              />
            </div>
          </div>

          {/* Cột phải: Preview thông tin xe */}
          <div className="w-full lg:w-80 p-6 bg-gray-50/50 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none overflow-y-auto max-h-[600px]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Hồ sơ xe (từ dữ liệu thực)
            </p>
            {showPreview ? (
              <VehiclePreviewPanel salesOrderId={form.sales_order} />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Shield size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Nhập ID đơn bán hàng</p>
                <p className="text-xs text-gray-300 mt-1">
                  để xem thông tin xe, kiểm định, tân trang
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {mut.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Đang tạo...
              </>
            ) : (
              <>
                <Shield size={14} /> Tạo bảo hành
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal xem chi tiết bảo hành ─────────────────────────────
function WarrantyDetailModal({
  warranty,
  onClose,
}: {
  warranty: any;
  onClose: () => void;
}) {
  const salesOrderId = warranty.sales_order;

  const { data: order, isLoading } = useQuery({
    queryKey: ["salesOrder", salesOrderId],
    queryFn: async () => {
      const res = await api.get(`/sales-orders/${salesOrderId}/`);
      return res.data;
    },
    enabled: !!salesOrderId,
  });

  const days = warranty.end_date ? daysUntilExpiry(warranty.end_date) : 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            Chi tiết bảo hành #{warranty.id}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Thông tin đơn bán */}
          {isLoading ? (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Đang tải...
            </div>
          ) : order ? (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Thông tin giao dịch
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Xe</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                    <Car size={12} className="text-blue-400" />
                    {order.vehicle_name || `Xe #${order.vehicle}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Khách hàng</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                    <User size={12} className="text-gray-400" />
                    {order.customer_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Số hợp đồng</p>
                  <p className="font-mono text-xs text-gray-600">
                    {order.contract_number || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">SĐT</p>
                  <p className="text-sm">{order.customer_phone || "—"}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Thông tin bảo hành */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Thời hạn", `${warranty.warranty_months} tháng`],
              [
                "Số km tối đa",
                `${Number(warranty.max_mileage || 0).toLocaleString("vi-VN")} km`,
              ],
              [
                "Ngày bắt đầu",
                warranty.start_date
                  ? new Date(warranty.start_date).toLocaleDateString("vi-VN")
                  : "—",
              ],
              [
                "Ngày kết thúc",
                warranty.end_date
                  ? new Date(warranty.end_date).toLocaleDateString("vi-VN")
                  : "—",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {warranty.status === "ACTIVE" && warranty.end_date && (
            <div
              className={`rounded-xl p-3 text-center text-sm font-semibold ${
                days <= 0
                  ? "bg-red-50 text-red-600"
                  : days <= 30
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-green-50 text-green-700"
              }`}
            >
              {days <= 0
                ? "Đã hết hạn bảo hành"
                : days <= 30
                  ? `⚠️ Còn ${days} ngày — sắp hết hạn`
                  : `✓ Còn ${days} ngày hiệu lực`}
            </div>
          )}

          {warranty.coverage_note && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Nội dung bảo hành</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">
                {warranty.coverage_note}
              </p>
            </div>
          )}

          {/* Hồ sơ xe đầy đủ */}
          {order?.vehicle && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Hồ sơ xe
              </p>
              <VehicleInfoSection vehicleId={order.vehicle} />
              <InspectionSection vehicleId={order.vehicle} />
              <RefurbishmentSection vehicleId={order.vehicle} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function AdminWarrantiesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<any | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["warranties", page, search],
    queryFn: async () => {
      const params: Record<string, any> = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const res = await api.get("/warranties/", { params });
      return res.data;
    },
  });

  const warranties: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const totalCount = data?.count ?? warranties.length;
  const active = warranties.filter((w) => w.status === "ACTIVE").length;
  const expired = warranties.filter((w) => w.status === "EXPIRED").length;
  const expiringSoon = warranties.filter((w) => {
    if (w.status !== "ACTIVE" || !w.end_date) return false;
    const d = daysUntilExpiry(w.end_date);
    return d > 0 && d <= 30;
  }).length;

  return (
    <AdminLayout
      title="Bảo hành xe"
      breadcrumb={[{ label: "Bán hàng" }, { label: "Bảo hành" }]}
    >
      {showCreate && (
        <CreateWarrantyModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["warranties"] })}
        />
      )}
      {selectedWarranty && (
        <WarrantyDetailModal
          warranty={selectedWarranty}
          onClose={() => setSelectedWarranty(null)}
        />
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
        {[
          {
            label: "Đang bảo hành",
            value: active,
            icon: <Shield size={18} className="text-green-600" />,
            bg: "bg-green-50",
            color: "text-green-700",
          },
          {
            label: "Sắp hết hạn (≤30 ngày)",
            value: expiringSoon,
            icon: <AlertTriangle size={18} className="text-yellow-600" />,
            bg: "bg-yellow-50",
            color: "text-yellow-700",
          },
          {
            label: "Đã hết hạn / hủy",
            value: expired,
            icon: <XCircle size={18} className="text-gray-500" />,
            bg: "bg-gray-50",
            color: "text-gray-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-2xl border border-white/60 p-4 flex items-center gap-4`}
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && warranties.length === 0 && !search && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 text-sm text-blue-700">
          <p className="font-bold mb-2">📋 Cách tạo hồ sơ bảo hành:</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>
              Xe trải qua: mua → kiểm định → tân trang → định giá → niêm yết
            </li>
            <li>Khách đặt cọc → xe RESERVED</li>
            <li>
              Tạo đơn bán tại trang <strong>Đơn bán hàng</strong> → xe SOLD
            </li>
            <li>
              Tại đây nhấn <strong>Tạo bảo hành</strong> → nhập{" "}
              <strong>ID đơn bán</strong>
            </li>
          </ol>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Hồ sơ bảo hành</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalCount} phiếu</p>
          </div>
          <div className="flex gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
                setPage(1);
              }}
              className="relative w-56"
            >
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm theo ID, nội dung..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
              />
            </form>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={15} /> Tạo bảo hành
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 flex flex-col items-center text-center">
            <AlertCircle size={32} className="text-red-300 mb-3" />
            <p className="text-gray-500 font-medium">Không thể tải dữ liệu</p>
          </div>
        ) : warranties.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Shield size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              Chưa có hồ sơ bảo hành nào
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700"
            >
              <Plus size={14} /> Tạo hồ sơ bảo hành
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Đơn bán</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Điều kiện BH
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Thời hạn
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">Còn lại</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {warranties.map((w) => {
                  const days = w.end_date ? daysUntilExpiry(w.end_date) : 0;
                  const isActive = w.status === "ACTIVE";
                  const isSoon = isActive && days > 0 && days <= 30;
                  return (
                    <tr
                      key={w.id}
                      className={`hover:bg-gray-50 transition-colors ${isSoon ? "bg-yellow-50/30" : ""}`}
                    >
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                        #{w.id}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                          Đơn #{w.sales_order}
                        </span>
                        {w.coverage_note && (
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-[140px]">
                            {w.coverage_note}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Car size={13} className="text-blue-400 shrink-0" />
                          <span className="font-semibold">
                            {w.warranty_months} tháng
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Tối đa{" "}
                          {Number(w.max_mileage || 0).toLocaleString("vi-VN")}{" "}
                          km
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar size={11} className="text-gray-400" />
                          {w.start_date
                            ? new Date(w.start_date).toLocaleDateString("vi-VN")
                            : "—"}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Calendar size={11} className="text-red-300" />
                          {w.end_date
                            ? new Date(w.end_date).toLocaleDateString("vi-VN")
                            : "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isActive && w.end_date ? (
                          isSoon ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
                              <Clock size={11} /> Còn {days} ngày
                            </span>
                          ) : days > 0 ? (
                            <span className="text-xs text-green-600 font-semibold">
                              Còn {days} ngày
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              Đã hết hạn
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {w.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle size={11} />{" "}
                            {w.status_display || "Còn hiệu lực"}
                          </span>
                        ) : w.status === "EXPIRED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                            <XCircle size={11} />{" "}
                            {w.status_display || "Hết hạn"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                            <XCircle size={11} /> {w.status_display || "Đã hủy"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedWarranty(w)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>
    </AdminLayout>
  );
}
