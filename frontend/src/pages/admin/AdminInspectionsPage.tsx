// src/pages/admin/AdminInspectionsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  WrenchIcon,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Car,
  User,
  Phone,
  Calendar,
  FileText,
  Search,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import {
  getInspections,
  createInspection,
  updateInspectionStatus,
  deleteInspection,
  type Inspection,
  type InspectionStatus,
  type InspectionCreatePayload,
} from "../../api/inspection";
import Pagination from "../../components/Pagination";

// ── Constants ──────────────────────────────────────────────────

const PAGE_SIZE = 15;

const STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; style: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ kiểm định",
    style: "bg-yellow-100 text-yellow-700",
    icon: <Clock size={12} />,
  },
  IN_PROGRESS: {
    label: "Đang kiểm định",
    style: "bg-blue-100 text-blue-700",
    icon: <WrenchIcon size={12} />,
  },
  COMPLETED: {
    label: "Đạt tiêu chuẩn",
    style: "bg-green-100 text-green-700",
    icon: <CheckCircle size={12} />,
  },
  FAILED: {
    label: "Không đạt",
    style: "bg-red-100 text-red-700",
    icon: <AlertCircle size={12} />,
  },
};

const SCORE_LABELS: {
  key: "engine_score" | "body_score" | "interior_score" | "electrical_score";
  label: string;
}[] = [
  { key: "engine_score", label: "Động cơ" },
  { key: "body_score", label: "Thân xe" },
  { key: "interior_score", label: "Nội thất" },
  { key: "electrical_score", label: "Điện" },
];

// ── Helpers ────────────────────────────────────────────────────

interface InspectionFormData {
  vehicle_id: string;
  scheduled_date: string;
  result_note: string;
  engine_score: string;
  body_score: string;
  interior_score: string;
  electrical_score: string;
}
interface FormErrors {
  vehicle_id?: string;
  scheduled_date?: string;
}
const EMPTY_FORM: InspectionFormData = {
  vehicle_id: "",
  scheduled_date: "",
  result_note: "",
  engine_score: "",
  body_score: "",
  interior_score: "",
  electrical_score: "",
};
function validateForm(form: InspectionFormData): FormErrors {
  const e: FormErrors = {};
  if (!form.vehicle_id.trim()) e.vehicle_id = "Vui lòng nhập ID xe";
  if (!form.scheduled_date) e.scheduled_date = "Vui lòng chọn ngày kiểm định";
  return e;
}
function inputClass(hasError: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
    hasError
      ? "border-red-400 bg-red-50"
      : "border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
  }`;
}
interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
function Field({ label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}
function ScoreBar({ score }: { score?: number }) {
  if (score === undefined || score === null)
    return <span className="text-gray-300 text-xs">—</span>;
  const color =
    score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700">{score}/10</span>
    </div>
  );
}
function avgScore(item: Inspection): string | null {
  const scores = SCORE_LABELS.map((s) => item[s.key]).filter(
    (v): v is number => typeof v === "number",
  );
  if (!scores.length) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}

// ── Main ───────────────────────────────────────────────────────

export default function AdminInspectionsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchText, setSearch] = useState("");
  const [filterStatus, setFilter] = useState<InspectionStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Inspection | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState<InspectionFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }
  function handleFilter(val: InspectionStatus | "") {
    setFilter(val);
    setPage(1);
  }

  // ── Query ──
  const { data, isLoading } = useQuery({
    queryKey: ["inspections", { page, searchText, filterStatus }],
    queryFn: () =>
      getInspections({
        page,
        page_size: PAGE_SIZE,
        search: searchText || undefined,
        status: filterStatus || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Hỗ trợ cả array lẫn paginated object từ backend
  const allData = Array.isArray(data) ? data : (data?.results ?? []);
  const totalCount = Array.isArray(data) ? data.length : (data?.count ?? 0);

  // Client-side filter nếu backend không hỗ trợ search
  const filtered = allData.filter((item) => {
    const q = searchText.toLowerCase();
    const matchSearch =
      !searchText ||
      item.vehicle_name.toLowerCase().includes(q) ||
      item.customer_name.toLowerCase().includes(q) ||
      item.phone.includes(searchText) ||
      item.inspector_name.toLowerCase().includes(q);
    const matchStatus = !filterStatus || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats: Record<InspectionStatus, number> = {
    PENDING: allData.filter((d) => d.status === "PENDING").length,
    IN_PROGRESS: allData.filter((d) => d.status === "IN_PROGRESS").length,
    COMPLETED: allData.filter((d) => d.status === "COMPLETED").length,
    FAILED: allData.filter((d) => d.status === "FAILED").length,
  };

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (payload: InspectionCreatePayload) => createInspection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: InspectionStatus }) =>
      updateInspectionStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inspections"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      setDeleteConfirmId(null);
      if (detailItem?.id === deleteConfirmId) setDetailItem(null);
    },
  });

  function handleFormChange(field: keyof InspectionFormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (formErrors[field as keyof FormErrors])
      setFormErrors((p) => ({ ...p, [field]: undefined }));
  }
  function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    createMutation.mutate({
      vehicle: Number(form.vehicle_id),
      inspection_date: form.scheduled_date || undefined,
      note: form.result_note || undefined,
    });
  }
  function openModal() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    createMutation.reset();
    setModalOpen(true);
  }

  const STAT_CARDS = [
    {
      label: "Chờ kiểm định",
      value: stats.PENDING,
      color: "bg-yellow-500",
      key: "PENDING",
    },
    {
      label: "Đang kiểm định",
      value: stats.IN_PROGRESS,
      color: "bg-blue-500",
      key: "IN_PROGRESS",
    },
    {
      label: "Đạt tiêu chuẩn",
      value: stats.COMPLETED,
      color: "bg-green-500",
      key: "COMPLETED",
    },
    {
      label: "Không đạt",
      value: stats.FAILED,
      color: "bg-red-500",
      key: "FAILED",
    },
  ] as const;

  return (
    <AdminLayout title="Kiểm định xe" breadcrumb={[{ label: "Kiểm định xe" }]}>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() =>
              handleFilter(
                filterStatus === card.key ? "" : (card.key as InspectionStatus),
              )
            }
            className={`bg-white rounded-xl border p-4 flex items-center gap-3 text-left shadow-sm hover:shadow-md transition-all ${filterStatus === card.key ? "border-red-400 ring-1 ring-red-200" : "border-gray-100"}`}
          >
            <div
              className={`${card.color} text-white rounded-lg p-2.5 shrink-0`}
            >
              <WrenchIcon size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Tìm theo tên xe, khách hàng, SĐT, nhân viên..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 transition-colors"
          />
          {searchText && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={filterStatus}
          onChange={(e) =>
            handleFilter(e.target.value as InspectionStatus | "")
          }
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white min-w-[160px]"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>
              {cfg.label}
            </option>
          ))}
        </select>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <Plus size={16} /> Tạo phiếu kiểm định
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Danh sách kiểm định</h2>
          <span className="text-sm text-gray-400">{totalCount} phiếu</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-14 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <WrenchIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">
              Không có phiếu kiểm định nào
            </p>
            <button
              onClick={openModal}
              className="mt-4 text-red-600 font-semibold text-sm hover:underline"
            >
              Tạo phiếu đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Xe</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Nhân viên
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Ngày kiểm
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">Điểm TB</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const cfg =
                    STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
                  const avg = avgScore(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                        #{item.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Car size={14} className="text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-900 truncate max-w-[140px]">
                            {item.vehicle_name}
                          </span>
                        </div>
                        {item.customer_name && (
                          <p className="text-xs text-gray-400 mt-0.5 ml-5">
                            {item.customer_name}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800 text-sm">
                          {item.inspector_name || "Chưa phân công"}
                        </p>
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-0.5"
                          >
                            <Phone size={11} /> {item.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Calendar size={13} className="text-gray-400" />
                          {item.scheduled_date
                            ? new Date(item.scheduled_date).toLocaleDateString(
                                "vi-VN",
                              )
                            : "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {avg ? (
                          <span
                            className={`font-black text-base ${Number(avg) >= 8 ? "text-green-600" : Number(avg) >= 5 ? "text-yellow-600" : "text-red-500"}`}
                          >
                            {avg}
                            <span className="text-gray-400 text-xs font-normal">
                              /10
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">Chưa có</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: item.id,
                              status: e.target.value as InspectionStatus,
                            })
                          }
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer ${cfg.style}`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                            <option key={val} value={val}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <ChevronRight size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION ── */}
        <Pagination
          page={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      {/* ── Create Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 text-red-600 p-1.5 rounded-lg">
                  <WrenchIcon size={16} />
                </div>
                <h2 className="font-black text-gray-900">
                  Tạo phiếu kiểm định
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              {createMutation.isError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {(createMutation.error as Error)?.message ?? "Có lỗi xảy ra."}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="ID Xe" required error={formErrors.vehicle_id}>
                  <input
                    type="number"
                    placeholder="vd: 42"
                    value={form.vehicle_id}
                    onChange={(e) =>
                      handleFormChange("vehicle_id", e.target.value)
                    }
                    className={inputClass(!!formErrors.vehicle_id)}
                  />
                </Field>
                <Field
                  label="Ngày kiểm định"
                  required
                  error={formErrors.scheduled_date}
                >
                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) =>
                      handleFormChange("scheduled_date", e.target.value)
                    }
                    className={inputClass(!!formErrors.scheduled_date)}
                  />
                </Field>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Điểm kiểm định{" "}
                  <span className="text-gray-400 font-normal">
                    (0–10, có thể điền sau)
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SCORE_LABELS.map((s) => (
                    <div key={s.key}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {s.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0–10"
                        value={form[s.key]}
                        onChange={(e) =>
                          handleFormChange(s.key, e.target.value)
                        }
                        className={inputClass(false)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Field label="Ghi chú / Kết quả kiểm định">
                <textarea
                  rows={3}
                  placeholder="Nhận xét tình trạng xe..."
                  value={form.result_note}
                  onChange={(e) =>
                    handleFormChange("result_note", e.target.value)
                  }
                  className={inputClass(false) + " resize-none"}
                />
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {createMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Tạo phiếu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailItem(null)}
          />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <p className="text-xs text-gray-400 font-mono">
                  #{detailItem.id}
                </p>
                <h3 className="font-black text-gray-900">
                  {detailItem.vehicle_name}
                </h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full ${(STATUS_CONFIG[detailItem.status] ?? STATUS_CONFIG.PENDING).style}`}
              >
                {STATUS_CONFIG[detailItem.status]?.icon}
                {STATUS_CONFIG[detailItem.status]?.label}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: <Car size={14} />,
                    label: "Xe",
                    value: detailItem.vehicle_name,
                  },
                  {
                    icon: <User size={14} />,
                    label: "Khách hàng",
                    value: detailItem.customer_name || "—",
                  },
                  {
                    icon: <Phone size={14} />,
                    label: "Điện thoại",
                    value: detailItem.phone || "—",
                  },
                  {
                    icon: <WrenchIcon size={14} />,
                    label: "Nhân viên",
                    value: detailItem.inspector_name || "Chưa phân công",
                  },
                  {
                    icon: <Calendar size={14} />,
                    label: "Ngày kiểm",
                    value: detailItem.scheduled_date
                      ? new Date(detailItem.scheduled_date).toLocaleDateString(
                          "vi-VN",
                        )
                      : "—",
                  },
                ].map((row) => (
                  <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      {row.icon}
                      <span className="text-xs">{row.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 break-all">
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <WrenchIcon size={15} className="text-red-500" /> Kết quả kiểm
                  định
                </h4>
                <div className="space-y-3">
                  {SCORE_LABELS.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">{s.label}</span>
                      <ScoreBar score={detailItem[s.key]} />
                    </div>
                  ))}
                </div>
                {(detailItem.overall_score || avgScore(detailItem)) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      Điểm tổng
                    </span>
                    <span
                      className={`text-2xl font-black ${Number(detailItem.overall_score ?? avgScore(detailItem)) >= 8 ? "text-green-600" : Number(detailItem.overall_score ?? avgScore(detailItem)) >= 5 ? "text-yellow-600" : "text-red-500"}`}
                    >
                      {detailItem.overall_score ?? avgScore(detailItem)}
                      <span className="text-gray-400 text-sm font-normal">
                        /10
                      </span>
                    </span>
                  </div>
                )}
                {detailItem.quality_grade && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">Xếp loại: </span>
                    <span className="font-black text-gray-800">
                      {detailItem.quality_grade_display ||
                        detailItem.quality_grade}
                    </span>
                  </div>
                )}
              </div>
              {(detailItem.conclusion || detailItem.result_note) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={13} /> Kết luận
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {detailItem.conclusion || detailItem.result_note}
                  </p>
                </div>
              )}
              {detailItem.recommendation && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                    Đề xuất tân trang
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {detailItem.recommendation}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">
                Tạo lúc:{" "}
                {new Date(detailItem.created_at).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setDeleteConfirmId(detailItem.id)}
                className="w-full flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <X size={15} /> Xóa phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="font-black text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-500 text-sm mb-6">
              Phiếu kiểm định <strong>#{deleteConfirmId}</strong> sẽ bị xóa vĩnh
              viễn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
