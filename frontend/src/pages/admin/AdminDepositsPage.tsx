// src/pages/admin/AdminDepositsPage.tsx
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  X,
  Search,
} from "lucide-react";

import AdminLayout from "../../layouts/AdminLayout";
import { confirmDeposit, cancelDeposit, type Deposit } from "../../api/sales";
import api from "../../api/client";
import Pagination from "../../components/Pagination";

type DepositStatus = Deposit["status"];

const PAGE_SIZE = 15;

const STATUS_CONFIG: Record<
  DepositStatus,
  { label: string; style: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    style: "bg-yellow-100 text-yellow-700",
    icon: <Clock size={12} />,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    style: "bg-green-100 text-green-700",
    icon: <CheckCircle size={12} />,
  },
  CANCELLED: {
    label: "Đã hủy",
    style: "bg-red-100 text-red-700",
    icon: <AlertCircle size={12} />,
  },
  REFUNDED: {
    label: "Hoàn cọc",
    style: "bg-gray-100 text-gray-600",
    icon: <X size={12} />,
  },
  CONVERTED: {
    label: "Đã chuyển đơn",
    style: "bg-blue-100 text-blue-700",
    icon: <CheckCircle size={12} />,
  },
};

// ✅ Gọi đúng endpoint admin — xem TẤT CẢ deposits
async function getAdminDeposits(params: {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
}): Promise<{ results: Deposit[]; count: number }> {
  const res = await api.get("/admin/deposits-list/", { params });
  return res.data;
}

export default function AdminDepositsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("");

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }
  function handleStatus(val: string) {
    setStatus(val);
    setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["adminDeposits", { page, search, statusFilter }],
    queryFn: () =>
      getAdminDeposits({
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const deposits = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const confirmMutation = useMutation({
    mutationFn: (id: number) => confirmDeposit(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminDeposits"] }),
  });
  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelDeposit(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminDeposits"] }),
  });

  const stats = {
    pending: deposits.filter((d) => d.status === "PENDING").length,
    confirmed: deposits.filter((d) => d.status === "CONFIRMED").length,
  };

  return (
    <AdminLayout title="Đơn đặt cọc" breadcrumb={[{ label: "Đơn đặt cọc" }]}>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Tổng đơn",
            value: totalCount,
            color: "text-gray-800",
            bg: "bg-white border-gray-100",
          },
          {
            label: "Chờ xác nhận",
            value: stats.pending,
            color: "text-yellow-700",
            bg: "bg-yellow-50 border-yellow-200",
          },
          {
            label: "Đã xác nhận",
            value: stats.confirmed,
            color: "text-green-700",
            bg: "bg-green-50 border-green-200",
          },
          {
            label: "Trang hiện tại",
            value: `${page} / ${Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}`,
            color: "text-blue-700",
            bg: "bg-blue-50 border-blue-200",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Tất cả đơn đặt cọc</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalCount} đơn</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                placeholder="Tìm khách hàng, xe..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 w-44 transition-colors"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-12 bg-gray-100 rounded animate-pulse"
              />
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Chưa có đơn đặt cọc nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">Liên hệ</th>
                  <th className="px-5 py-3 text-left font-semibold">Xe</th>
                  <th className="px-5 py-3 text-left font-semibold">Số tiền</th>
                  <th className="px-5 py-3 text-left font-semibold">Ghi chú</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Thời gian
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-center font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deposits.map((d) => {
                  const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.PENDING;
                  const isPending = d.status === "PENDING";
                  const isConfirmed = d.status === "CONFIRMED";
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                        #{d.id}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {d.customer_name}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700">{d.customer_phone}</p>
                        {d.customer_email && (
                          <p className="text-gray-400 text-xs">
                            {d.customer_email}
                          </p>
                        )}
                        <a
                          href={`tel:${d.customer_phone}`}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline mt-0.5"
                        >
                          <Phone size={11} /> Gọi
                        </a>
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {d.vehicle_name ?? `Xe #${d.vehicle}`}
                      </td>
                      <td className="px-5 py-4 font-semibold text-red-600 whitespace-nowrap">
                        {Number(d.amount).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs max-w-[120px] truncate">
                        {d.note || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(d.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.style}`}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <button
                              onClick={() => confirmMutation.mutate(d.id)}
                              disabled={confirmMutation.isPending}
                              className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Xác nhận
                            </button>
                          )}
                          {(isPending || isConfirmed) && (
                            <button
                              onClick={() => cancelMutation.mutate(d.id)}
                              disabled={cancelMutation.isPending}
                              className="text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
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
