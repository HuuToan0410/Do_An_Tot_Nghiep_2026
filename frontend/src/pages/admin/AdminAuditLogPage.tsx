// src/pages/admin/AdminAuditLogPage.tsx
// Trang xem nhật ký thao tác hệ thống — chỉ ADMIN
// Backend: GET /api/admin/audit-logs/?model=...&object_id=...

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  User,
  Clock,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Eye,
  Database,
} from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api/client";
import Pagination from "../../components/Pagination";

// ── Types (khớp AuditLogSerializer) ───────────────────────────

interface AuditLog {
  id: number;
  user: number | null;
  user_name: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "STATUS_CHANGE"
    | "APPROVE"
    | "REJECT";
  action_display: string;
  model_name: string;
  object_id: number;
  description: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogResponse {
  results: AuditLog[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ── Constants ──────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  CREATE: {
    label: "Tạo mới",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: <Plus size={12} />,
  },
  UPDATE: {
    label: "Cập nhật",
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: <Edit3 size={12} />,
  },
  DELETE: {
    label: "Xóa",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: <Trash2 size={12} />,
  },
  STATUS_CHANGE: {
    label: "Đổi trạng thái",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: <ArrowUpDown size={12} />,
  },
  APPROVE: {
    label: "Phê duyệt",
    color: "text-teal-700",
    bg: "bg-teal-100",
    icon: <CheckCircle size={12} />,
  },
  REJECT: {
    label: "Từ chối",
    color: "text-orange-700",
    bg: "bg-orange-100",
    icon: <XCircle size={12} />,
  },
};

const MODEL_LABELS: Record<string, string> = {
  VehicleUnit: "Xe",
  Inspection: "Kiểm định",
  RefurbishmentOrder: "Tân trang",
  VehiclePricing: "Định giá",
  Deposit: "Đặt cọc",
  SalesOrder: "Đơn bán",
  WarrantyRecord: "Bảo hành",
  HandoverRecord: "Bàn giao",
  User: "Người dùng",
  Appointment: "Lịch hẹn",
};

const PAGE_SIZE = 20;

// ── Helpers ────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    relative: getRelative(d),
  };
}

function getRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

// ── Action Badge ───────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? {
    label: action,
    color: "text-gray-700",
    bg: "bg-gray-100",
    icon: <FileText size={12} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── JSON Diff Viewer ───────────────────────────────────────────

function JsonDiff({
  old_value,
  new_value,
}: {
  old_value: any;
  new_value: any;
}) {
  if (!old_value && !new_value)
    return (
      <p className="text-xs text-gray-400 italic">Không có thay đổi chi tiết</p>
    );

  const allKeys = Array.from(
    new Set([...Object.keys(old_value ?? {}), ...Object.keys(new_value ?? {})]),
  );

  if (allKeys.length === 0) return null;

  return (
    <div className="space-y-1">
      {allKeys.map((key) => {
        const oldVal = old_value?.[key];
        const newVal = new_value?.[key];
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

        return (
          <div
            key={key}
            className={`flex items-start gap-2 text-xs rounded-lg px-3 py-1.5 ${changed ? "bg-yellow-50 border border-yellow-100" : "bg-gray-50"}`}
          >
            <span className="font-mono text-gray-500 shrink-0 min-w-[120px]">
              {key}:
            </span>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {changed && old_value && (
                <span
                  className="text-red-600 line-through font-mono truncate max-w-[160px]"
                  title={String(oldVal)}
                >
                  {String(oldVal ?? "—")}
                </span>
              )}
              {changed && (
                <ChevronRight size={12} className="text-gray-400 shrink-0" />
              )}
              <span
                className={`font-mono truncate max-w-[160px] ${changed ? "text-green-700 font-semibold" : "text-gray-600"}`}
                title={String(newVal)}
              >
                {String(newVal ?? "—")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Log Row ────────────────────────────────────────────────────

function LogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const dt = formatDateTime(log.created_at);
  const hasDetail = log.old_value || log.new_value;
  const modelLabel = MODEL_LABELS[log.model_name] ?? log.model_name;

  return (
    <>
      <tr
        className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${expanded ? "bg-blue-50/30" : ""}`}
        onClick={() => hasDetail && setExpanded((e) => !e)}
      >
        {/* Thời gian */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <p className="text-xs font-semibold text-gray-700">{dt.date}</p>
          <p className="text-[10px] text-gray-400 font-mono">{dt.time}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{dt.relative}</p>
        </td>

        {/* Nhân viên */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <User size={13} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
                {log.user_name || "Hệ thống"}
              </p>
              {log.ip_address && (
                <p className="text-[10px] text-gray-400 font-mono">
                  {log.ip_address}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Hành động */}
        <td className="px-4 py-3.5">
          <ActionBadge action={log.action} />
        </td>

        {/* Đối tượng */}
        <td className="px-4 py-3.5">
          <p className="text-sm font-semibold text-gray-800">{modelLabel}</p>
          <p className="text-[10px] text-gray-400 font-mono">
            ID #{log.object_id}
          </p>
        </td>

        {/* Mô tả */}
        <td className="px-4 py-3.5 max-w-[240px]">
          <p className="text-sm text-gray-600 truncate" title={log.description}>
            {log.description}
          </p>
        </td>

        {/* Expand */}
        <td className="px-4 py-3.5 text-center">
          {hasDetail ? (
            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              {expanded ? <ChevronDown size={15} /> : <Eye size={15} />}
            </button>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && hasDetail && (
        <tr className="bg-blue-50/20">
          <td colSpan={6} className="px-6 py-4 border-t border-blue-100">
            <div className="max-w-3xl">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Database size={13} className="text-blue-500" /> Chi tiết thay
                đổi dữ liệu
              </p>
              {log.old_value || log.new_value ? (
                <JsonDiff old_value={log.old_value} new_value={log.new_value} />
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Không có dữ liệu chi tiết
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [objectId, setObjectId] = useState("");

  // ── Fetch /api/admin/audit-logs/ ──────────────────────────
  const { data, isLoading, isFetching, refetch } = useQuery<AuditLogResponse>({
    queryKey: ["auditLogs", page, modelFilter, actionFilter, objectId, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(PAGE_SIZE),
      };
      if (modelFilter) params.model = modelFilter;
      if (actionFilter) params.action = actionFilter;
      if (objectId) params.object_id = objectId;
      if (search) params.search = search;
      const res = await api.get("/admin/audit-logs/", { params });
      // Backend trả về array hoặc paginated
      if (Array.isArray(res.data))
        return {
          results: res.data,
          count: res.data.length,
          next: null,
          previous: null,
        };
      return res.data;
    },
    staleTime: 1000 * 30,
  });

  const logs = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  // Stats từ data hiện tại
  const actionStats = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] ?? 0) + 1;
    return acc;
  }, {});

  const uniqueUsers = new Set(logs.map((l) => l.user_name)).size;
  const deleteCount = actionStats["DELETE"] ?? 0;
  const updateCount =
    (actionStats["UPDATE"] ?? 0) + (actionStats["STATUS_CHANGE"] ?? 0);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setSearchInput("");
    setModelFilter("");
    setActionFilter("");
    setObjectId("");
    setPage(1);
  }

  const hasFilter = !!(search || modelFilter || actionFilter || objectId);

  return (
    <AdminLayout
      title="Nhật ký hệ thống"
      breadcrumb={[{ label: "Bảo mật" }, { label: "Nhật ký thao tác" }]}
    >
      {/* ── Header security notice ── */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-6">
        <Shield size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-800 text-sm">
            Nhật ký bảo mật hệ thống
          </p>
          <p className="text-blue-700 text-xs mt-0.5">
            Ghi lại toàn bộ thao tác tạo, sửa, xóa dữ liệu của nhân viên. Chỉ
            Admin mới có quyền xem trang này.
          </p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {[
          {
            label: "Tổng thao tác",
            value: totalCount,
            icon: <FileText size={18} />,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Người dùng",
            value: uniqueUsers,
            icon: <User size={18} />,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Lần xóa dữ liệu",
            value: deleteCount,
            icon: <Trash2 size={18} />,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Lần cập nhật",
            value: updateCount,
            icon: <Edit3 size={18} />,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0 ${s.color}`}
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{s.label}</p>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Lịch sử thao tác</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalCount} bản ghi{hasFilter ? " · Đang lọc" : ""}
                {isFetching && " · Đang cập nhật..."}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => refetch()}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
                title="Làm mới"
              >
                <RefreshCw
                  size={15}
                  className={isFetching ? "animate-spin" : ""}
                />
              </button>
              {hasFilter && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-red-600 font-semibold border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2">
            {/* Search mô tả */}
            <form
              onSubmit={handleSearch}
              className="relative flex-1 min-w-[200px]"
            >
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm theo mô tả, tên nhân viên..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </form>

            {/* Model filter */}
            <div className="relative">
              <Filter
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={modelFilter}
                onChange={(e) => {
                  setModelFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 appearance-none"
              >
                <option value="">Tất cả model</option>
                {Object.entries(MODEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Action filter */}
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400"
              >
                <option value="">Tất cả hành động</option>
                {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Object ID filter */}
            <input
              type="number"
              placeholder="ID đối tượng"
              value={objectId}
              onChange={(e) => {
                setObjectId(e.target.value);
                setPage(1);
              }}
              className="w-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Action quick-filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
              const count = logs.filter((l) => l.action === key).length;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActionFilter(actionFilter === key ? "" : key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    actionFilter === key
                      ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {cfg.icon} {cfg.label}
                  {count > 0 && (
                    <span className="bg-white/60 px-1 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-14 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Shield size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">
              Không tìm thấy bản ghi nào
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {hasFilter
                ? "Thử xóa bộ lọc để xem tất cả"
                : "Chưa có thao tác nào được ghi lại"}
            </p>
            {hasFilter && (
              <button
                onClick={resetFilters}
                className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      Thời gian
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User size={12} />
                      Nhân viên
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Hành động
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Đối tượng
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Mô tả</th>
                  <th className="px-4 py-3 text-center font-semibold w-16">
                    <div className="flex items-center justify-center gap-1">
                      <Eye size={12} />
                      Chi tiết
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="border-t border-gray-100">
          <Pagination
            page={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>

      {/* ── Security tips ── */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: <AlertTriangle size={15} className="text-red-500" />,
            title: "Hành động nguy hiểm",
            desc: "Các thao tác XÓA cần được kiểm tra kỹ. Xem bộ lọc 'Xóa'.",
            action: () => setActionFilter("DELETE"),
          },
          {
            icon: <Eye size={15} className="text-blue-500" />,
            title: "Theo dõi nhân viên",
            desc: "Lọc theo tên để xem toàn bộ thao tác của một nhân viên.",
            action: null,
          },
          {
            icon: <Shield size={15} className="text-green-500" />,
            title: "Kiểm tra định giá",
            desc: "Xem các thao tác APPROVE/REJECT trên phiếu định giá.",
            action: () => {
              setModelFilter("VehiclePricing");
              setActionFilter("APPROVE");
            },
          },
        ].map((tip) => (
          <button
            key={tip.title}
            onClick={tip.action ?? undefined}
            className={`text-left bg-white rounded-xl border border-gray-100 p-4 shadow-sm transition-all ${tip.action ? "hover:border-blue-300 hover:shadow-md cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {tip.icon}
              <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
            </div>
            <p className="text-xs text-gray-500">{tip.desc}</p>
            {tip.action && (
              <p className="text-xs text-blue-600 font-semibold mt-2">
                Áp dụng bộ lọc →
              </p>
            )}
          </button>
        ))}
      </div>
    </AdminLayout>
  );
}
